-- ============================================================
-- Migration 002: Create categories table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id             UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL CHECK (char_length(name) <= 50),
  slug           TEXT        NOT NULL,
  description    TEXT        CHECK (char_length(description) <= 200),
  color          TEXT        NOT NULL DEFAULT '#6B7280',
  icon           TEXT,
  parent_id      UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  bookmark_count INTEGER     NOT NULL DEFAULT 0,
  is_default     BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT categories_unique_user_slug UNIQUE (user_id, slug),
  CONSTRAINT categories_no_self_parent   CHECK (parent_id != id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id   ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
