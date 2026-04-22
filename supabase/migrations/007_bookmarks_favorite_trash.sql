-- ============================================================
-- Migration 007: Favorites + soft-delete (Trash) + counts RPC
-- ============================================================

-- Add is_favorite + deleted_at columns
ALTER TABLE public.bookmarks
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

-- Allow uncategorised bookmarks (Unsorted view)
ALTER TABLE public.bookmarks
  ALTER COLUMN category_id DROP NOT NULL;

-- Partial indexes for fast favorite + trash queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_favorite
  ON public.bookmarks (user_id)
  WHERE is_favorite = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_deleted
  ON public.bookmarks (user_id)
  WHERE deleted_at IS NOT NULL;

-- ============================================================
-- get_bookmark_counts(user_id) RPC
-- Returns: { total, favorites, archived, trashed, unsorted, by_category, by_tag }
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_bookmark_counts(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result        JSONB;
  v_total       INT;
  v_favorites   INT;
  v_archived    INT;
  v_trashed     INT;
  v_unsorted    INT;
  v_by_category JSONB;
  v_by_tag      JSONB;
BEGIN
  -- Authorize: must match auth.uid() or be elevated
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO v_total
    FROM bookmarks
   WHERE user_id = p_user_id
     AND deleted_at IS NULL
     AND is_archived = false;

  SELECT COUNT(*) INTO v_favorites
    FROM bookmarks
   WHERE user_id = p_user_id
     AND deleted_at IS NULL
     AND is_favorite = true;

  SELECT COUNT(*) INTO v_archived
    FROM bookmarks
   WHERE user_id = p_user_id
     AND deleted_at IS NULL
     AND is_archived = true;

  SELECT COUNT(*) INTO v_trashed
    FROM bookmarks
   WHERE user_id = p_user_id
     AND deleted_at IS NOT NULL;

  SELECT COUNT(*) INTO v_unsorted
    FROM bookmarks
   WHERE user_id = p_user_id
     AND deleted_at IS NULL
     AND is_archived = false
     AND category_id IS NULL;

  SELECT COALESCE(jsonb_object_agg(category_id::text, n), '{}'::jsonb)
    INTO v_by_category
    FROM (
      SELECT category_id, COUNT(*) AS n
        FROM bookmarks
       WHERE user_id = p_user_id
         AND deleted_at IS NULL
         AND is_archived = false
         AND category_id IS NOT NULL
       GROUP BY category_id
    ) c;

  SELECT COALESCE(jsonb_object_agg(tag, n), '{}'::jsonb)
    INTO v_by_tag
    FROM (
      SELECT UNNEST(tags) AS tag, COUNT(*) AS n
        FROM bookmarks
       WHERE user_id = p_user_id
         AND deleted_at IS NULL
         AND is_archived = false
       GROUP BY tag
       ORDER BY n DESC
       LIMIT 100
    ) t;

  result := jsonb_build_object(
    'total',       v_total,
    'favorites',   v_favorites,
    'archived',    v_archived,
    'trashed',     v_trashed,
    'unsorted',    v_unsorted,
    'by_category', v_by_category,
    'by_tag',      v_by_tag
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bookmark_counts(UUID) TO authenticated;
