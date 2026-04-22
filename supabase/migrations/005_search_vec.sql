-- Add full-text search vector to bookmarks
-- Required by: src/app/api/search/route.ts — textSearch('search_vec', ...)

ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS search_vec tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(domain, '') || ' ' ||
        coalesce(array_to_string(tags, ' '), '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS bookmarks_search_vec_idx
  ON bookmarks USING GIN (search_vec);
