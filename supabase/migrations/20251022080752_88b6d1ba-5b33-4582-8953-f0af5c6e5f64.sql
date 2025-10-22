-- Sync any missing profiles from auth.users
-- This handles cases where the handle_new_user trigger failed
INSERT INTO public.profiles (user_id, email, display_name, signup_method, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as display_name,
  CASE
    WHEN au.raw_user_meta_data->>'provider' = 'google' THEN 'google'
    WHEN au.raw_user_meta_data->>'provider' = 'apple' THEN 'apple'
    WHEN au.raw_app_meta_data->>'provider' = 'google' THEN 'google'
    WHEN au.raw_app_meta_data->>'provider' = 'apple' THEN 'apple'
    ELSE 'email'
  END as signup_method,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- Improve the handle_new_user trigger to log errors properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
DECLARE
  v_display_name TEXT;
  v_signup_method TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Try to get display name from various metadata fields
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Detect signup method
  v_signup_method := CASE
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://accounts.google.com' THEN 'google'
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN NEW.raw_user_meta_data ->> 'signup_method' IS NOT NULL THEN NEW.raw_user_meta_data ->> 'signup_method'
    ELSE 'email'
  END;
  
  -- Get avatar URL
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NEW.raw_user_meta_data ->> 'photo'
  );
  
  -- Insert or update profile with the EXACT created_at from auth.users
  INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url, created_at)
  VALUES (
    NEW.id,
    v_display_name,
    NEW.email,
    v_signup_method,
    v_avatar_url,
    NEW.created_at  -- Copy the exact timestamp from auth.users
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    signup_method = COALESCE(EXCLUDED.signup_method, profiles.signup_method),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error with details
  RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)', 
    NEW.id, SQLERRM, SQLSTATE;
  -- Still return NEW to not block the auth signup
  RETURN NEW;
END;
$$;