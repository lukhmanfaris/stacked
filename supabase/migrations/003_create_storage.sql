-- ============================================================
-- Migration 003: Storage buckets + domain_assets metadata
-- ============================================================

-- Domain asset metadata: maps domain → cached storage URLs + freshness
-- Prevents duplicate fetches; shared across all users (dedup by domain)
CREATE TABLE IF NOT EXISTS public.domain_assets (
  domain_hash             TEXT        NOT NULL PRIMARY KEY,
  domain                  TEXT        NOT NULL,
  favicon_url             TEXT,
  og_image_url            TEXT,
  favicon_refreshed_at    TIMESTAMPTZ,
  og_image_refreshed_at   TIMESTAMPTZ,
  fetch_attempted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fetch_failed            BOOLEAN     NOT NULL DEFAULT false,
  orphaned_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_assets_domain
  ON public.domain_assets (domain);

CREATE INDEX IF NOT EXISTS idx_domain_assets_favicon_refreshed
  ON public.domain_assets (favicon_refreshed_at);

CREATE INDEX IF NOT EXISTS idx_domain_assets_og_refreshed
  ON public.domain_assets (og_image_refreshed_at);

-- Partial index — only rows pending cleanup
CREATE INDEX IF NOT EXISTS idx_domain_assets_orphaned
  ON public.domain_assets (orphaned_at)
  WHERE orphaned_at IS NOT NULL;

ALTER TABLE public.domain_assets ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (including anon) can look up domain asset URLs
CREATE POLICY "domain_assets_select_public"
  ON public.domain_assets
  FOR SELECT
  USING (true);

-- No INSERT / UPDATE / DELETE policies for regular users.
-- Only the service role key (edge functions) writes to this table.

CREATE TRIGGER domain_assets_set_updated_at
  BEFORE UPDATE ON public.domain_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Orphan helper: called by bookmark delete trigger (wired in M3)
-- Marks a domain_assets row as orphaned when no bookmarks
-- reference that domain. Actual storage deletion is deferred
-- to the cleanup edge function (7-day grace period).
-- ============================================================

CREATE OR REPLACE FUNCTION public.maybe_orphan_domain(p_domain TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-check live bookmarks table to be safe under concurrent deletes
  IF NOT EXISTS (
    SELECT 1 FROM public.bookmarks WHERE domain = p_domain LIMIT 1
  ) THEN
    UPDATE public.domain_assets
    SET orphaned_at = now()
    WHERE domain = p_domain
      AND orphaned_at IS NULL;
  END IF;
END;
$$;

-- ============================================================
-- Storage buckets
-- Paths:
--   favicons/   {domain_hash}.png      — public, service-role write only
--   og-images/  {domain_hash}.webp     — public, service-role write only
--   avatars/    {user_id}/avatar.webp  — public, user-scoped write
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'favicons',
    'favicons',
    true,
    512000,
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/webp']
  ),
  (
    'og-images',
    'og-images',
    true,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    1048576,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS policies
-- ============================================================

-- favicons: public read, no user write (service role only)
CREATE POLICY "favicons_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'favicons');

-- og-images: public read, no user write (service role only)
CREATE POLICY "og_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'og-images');

-- avatars: public read, user-scoped write (folder must match auth.uid())
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
