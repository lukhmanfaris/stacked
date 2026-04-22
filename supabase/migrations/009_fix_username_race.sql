-- Fix race condition in handle_new_user trigger.
-- WHILE loop + INSERT are not atomic — concurrent trigger fires can both
-- see a username as available and collide on insert.
-- Solution: catch unique_violation and fall back to a random suffix.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter       INT := 0;
BEGIN
  -- Derive base username from email prefix
  base_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_-]', '', 'g'));
  IF length(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;
  base_username := left(base_username, 25);

  -- Find a unique username (best-effort — race condition handled below)
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, onboarding_step, tier)
  VALUES (NEW.id, NEW.email, final_username, 'username', 'free')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN unique_violation THEN
  -- Two concurrent triggers both picked the same username.
  -- Retry once with a random 4-digit suffix — statistically unique.
  INSERT INTO public.profiles (id, email, username, onboarding_step, tier)
  VALUES (
    NEW.id,
    NEW.email,
    left(base_username, 20) || '_' || floor(random() * 9000 + 1000)::TEXT,
    'username',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
