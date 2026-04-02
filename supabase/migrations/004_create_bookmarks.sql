-- ============================================================
-- Migration 004: Create bookmarks table
-- ============================================================

-- Link status enum
CREATE TYPE public.link_status AS ENUM (
  'unchecked',
  'alive',
  'dead',
  'redirected',
  'timeout'
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id             UUID              NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id    UUID              NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  url            TEXT              NOT NULL CHECK (char_length(url) <= 2048),
  title          TEXT              NOT NULL CHECK (char_length(title) <= 200),
  description    TEXT              CHECK (char_length(description) <= 500),
  domain         TEXT              NOT NULL,
  tags           TEXT[]            NOT NULL DEFAULT '{}',
  favicon_url    TEXT,
  og_image_url   TEXT,
  is_pinned      BOOLEAN           NOT NULL DEFAULT false,
  is_archived    BOOLEAN           NOT NULL DEFAULT false,
  link_status    public.link_status NOT NULL DEFAULT 'unchecked',
  sort_order     INTEGER           NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id       ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category_id   ON public.bookmarks (category_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_domain        ON public.bookmarks (domain);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_pinned     ON public.bookmarks (user_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_archived   ON public.bookmarks (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags          ON public.bookmarks USING GIN (tags);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update_own" ON public.bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================

CREATE TRIGGER bookmarks_set_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Category bookmark_count maintenance
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_category_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories
      SET bookmark_count = bookmark_count + 1
      WHERE id = NEW.category_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories
      SET bookmark_count = GREATEST(bookmark_count - 1, 0)
      WHERE id = OLD.category_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    UPDATE public.categories
      SET bookmark_count = GREATEST(bookmark_count - 1, 0)
      WHERE id = OLD.category_id;
    UPDATE public.categories
      SET bookmark_count = bookmark_count + 1
      WHERE id = NEW.category_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER bookmarks_sync_category_count
  AFTER INSERT OR UPDATE OF category_id OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.sync_category_bookmark_count();
