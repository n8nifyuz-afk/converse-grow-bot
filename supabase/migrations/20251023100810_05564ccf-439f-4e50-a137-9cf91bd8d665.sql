-- Add IP address and country columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Update the handle_new_user function to capture IP and country from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_display_name TEXT;
  v_signup_method TEXT;
  v_avatar_url TEXT;
  v_ip_address TEXT;
  v_country TEXT;
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
  
  -- Get IP address and country from metadata
  v_ip_address := NEW.raw_user_meta_data ->> 'ip_address';
  v_country := NEW.raw_user_meta_data ->> 'country';
  
  -- Insert or update profile with the EXACT created_at from auth.users
  INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url, ip_address, country, created_at)
  VALUES (
    NEW.id,
    v_display_name,
    NEW.email,
    v_signup_method,
    v_avatar_url,
    v_ip_address,
    v_country,
    NEW.created_at  -- Copy the exact timestamp from auth.users
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    signup_method = COALESCE(EXCLUDED.signup_method, profiles.signup_method),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    ip_address = COALESCE(EXCLUDED.ip_address, profiles.ip_address),
    country = COALESCE(EXCLUDED.country, profiles.country),
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