-- Migration 011: Link Health Monitor (Feature M10)
-- Adds last_checked_at so the edge function knows which bookmarks are stale.

ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient stale-bookmark queries in the edge function
CREATE INDEX IF NOT EXISTS bookmarks_last_checked_at_idx
  ON bookmarks (last_checked_at ASC NULLS FIRST);
