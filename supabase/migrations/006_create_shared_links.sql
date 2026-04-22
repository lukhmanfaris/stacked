-- 006_create_shared_links.sql
-- Portable public bookmark collections shareable via slug URL

CREATE TABLE shared_links (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug              TEXT        NOT NULL UNIQUE,
  title             TEXT,
  description       TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  layout            TEXT        NOT NULL DEFAULT 'cards'
                    CHECK (layout IN ('minimal', 'cards', 'masonry', 'terminal')),
  theme             TEXT        NOT NULL DEFAULT 'light'
                    CHECK (theme IN ('light', 'dark')),
  category_ids      UUID[]      NOT NULL DEFAULT '{}',
  show_favicons     BOOLEAN     NOT NULL DEFAULT true,
  show_descriptions BOOLEAN     NOT NULL DEFAULT true,
  show_tags         BOOLEAN     NOT NULL DEFAULT true,
  view_count        INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE TRIGGER set_shared_links_updated_at
  BEFORE UPDATE ON shared_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: owners manage their own links; anon can read active links
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shared_links"
  ON shared_links FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone reads active shared_links"
  ON shared_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RPC to safely increment view_count without auth
CREATE OR REPLACE FUNCTION increment_shared_link_views(link_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE shared_links SET view_count = view_count + 1 WHERE id = link_id AND is_active = true;
$$;
