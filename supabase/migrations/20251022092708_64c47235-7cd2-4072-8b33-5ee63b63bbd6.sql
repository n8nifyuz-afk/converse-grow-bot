-- Create a function to check if user is blocked before allowing sign in
CREATE OR REPLACE FUNCTION public.check_user_not_blocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  -- Check if the user's profile is blocked
  SELECT blocked INTO v_blocked
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- If user is blocked, prevent the auth event
  IF v_blocked = true THEN
    RAISE EXCEPTION 'Account is blocked. Please contact support.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_blocked_user_signin ON auth.sessions;

-- Create trigger on auth.sessions to prevent blocked users from signing in
-- This runs before a session is created, blocking the sign-in at the source
CREATE TRIGGER prevent_blocked_user_signin
  BEFORE INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_not_blocked();