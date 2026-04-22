-- Security-definer function for username availability check.
-- Bypasses RLS (which restricts SELECT to own row only),
-- so clients can check if any username is taken without leaking profile data.

CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = p_username
  );
END;
$$;

-- Revoke direct execute from public, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_username_available(TEXT) TO authenticated;
