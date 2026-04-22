-- M12: Marketing consent flag on profiles
-- Stores whether the user opted in to product updates and announcements.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;
