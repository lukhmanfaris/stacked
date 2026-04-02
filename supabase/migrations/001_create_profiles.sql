-- ============================================================
-- Migration 001: Create profiles table
-- ============================================================

-- Profiles table extending auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL,
  email_verified    BOOLEAN     NOT NULL DEFAULT false,
  username          TEXT        NOT NULL UNIQUE,
  display_name      TEXT,
  avatar_url        TEXT,
  bio               TEXT        CHECK (char_length(bio) <= 300),
  tier              TEXT        NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  onboarding_step   TEXT        NOT NULL DEFAULT 'username'
                                CHECK (onboarding_step IN ('username', 'categories', 'first_bookmark', 'done')),
  preferences       JSONB       NOT NULL DEFAULT '{
    "theme": "system",
    "default_view": "stack",
    "default_category_id": null,
    "items_per_page": 20,
    "show_favicons": true,
    "show_og_images": true,
    "compact_mode": false,
    "email_notifications": true
  }'::jsonb,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_email    ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_tier     ON public.profiles (tier);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- updated_at auto-update trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Auto-create profile on new auth.users row
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter       INT := 0;
BEGIN
  -- Derive a base username from email (before @, lowercased, sanitized)
  base_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_-]', '', 'g'));
  -- Ensure minimum length
  IF length(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;
  -- Trim to 25 chars to leave room for suffix
  base_username := left(base_username, 25);

  -- Find a unique username
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, onboarding_step, tier)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    'username',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Update last_login_at on sign-in (via Supabase Auth hook)
-- This runs on auth.users update when last_sign_in_at changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    UPDATE public.profiles
    SET last_login_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_signin
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signin();
