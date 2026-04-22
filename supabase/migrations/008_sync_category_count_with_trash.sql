-- ============================================================
-- Migration 008: Sync categories.bookmark_count with soft-delete
-- ============================================================
-- Original trigger (004) only counts INSERT/DELETE/category change.
-- After 007 added deleted_at, soft-delete leaves the column stale.
-- This rewrite handles deleted_at transitions and nullable category_id.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_category_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only count live (non-trashed) rows with a category
    IF NEW.deleted_at IS NULL AND NEW.category_id IS NOT NULL THEN
      UPDATE public.categories
        SET bookmark_count = bookmark_count + 1
        WHERE id = NEW.category_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Hard delete: decrement only if it was still live
    IF OLD.deleted_at IS NULL AND OLD.category_id IS NOT NULL THEN
      UPDATE public.categories
        SET bookmark_count = GREATEST(bookmark_count - 1, 0)
        WHERE id = OLD.category_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    DECLARE
      was_live BOOLEAN := OLD.deleted_at IS NULL;
      is_live  BOOLEAN := NEW.deleted_at IS NULL;
    BEGIN
      -- Trash transition: live -> trashed
      IF was_live AND NOT is_live THEN
        IF OLD.category_id IS NOT NULL THEN
          UPDATE public.categories
            SET bookmark_count = GREATEST(bookmark_count - 1, 0)
            WHERE id = OLD.category_id;
        END IF;

      -- Restore transition: trashed -> live
      ELSIF NOT was_live AND is_live THEN
        IF NEW.category_id IS NOT NULL THEN
          UPDATE public.categories
            SET bookmark_count = bookmark_count + 1
            WHERE id = NEW.category_id;
        END IF;

      -- Stayed live, but category moved
      ELSIF was_live AND is_live
            AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        IF OLD.category_id IS NOT NULL THEN
          UPDATE public.categories
            SET bookmark_count = GREATEST(bookmark_count - 1, 0)
            WHERE id = OLD.category_id;
        END IF;
        IF NEW.category_id IS NOT NULL THEN
          UPDATE public.categories
            SET bookmark_count = bookmark_count + 1
            WHERE id = NEW.category_id;
        END IF;
      END IF;
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger needs to fire on deleted_at changes too (was: only category_id)
DROP TRIGGER IF EXISTS bookmarks_sync_category_count ON public.bookmarks;

CREATE TRIGGER bookmarks_sync_category_count
  AFTER INSERT OR DELETE OR UPDATE OF category_id, deleted_at
  ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.sync_category_bookmark_count();

-- ============================================================
-- One-time backfill: recompute counts from current live rows
-- ============================================================
UPDATE public.categories c
   SET bookmark_count = COALESCE(sub.n, 0)
  FROM (
    SELECT category_id, COUNT(*) AS n
      FROM public.bookmarks
     WHERE deleted_at IS NULL
       AND category_id IS NOT NULL
     GROUP BY category_id
  ) sub
 WHERE c.id = sub.category_id;

-- Zero out categories that have no live bookmarks
UPDATE public.categories
   SET bookmark_count = 0
 WHERE id NOT IN (
   SELECT DISTINCT category_id
     FROM public.bookmarks
    WHERE deleted_at IS NULL AND category_id IS NOT NULL
 );
