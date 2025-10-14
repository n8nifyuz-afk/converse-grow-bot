-- Fix the existing Google user profile that was incorrectly marked as 'email'
UPDATE profiles 
SET signup_method = 'google',
    avatar_url = 'https://lh3.googleusercontent.com/a/ACg8ocLi5-ilMWatL4lui48GibkLs_Q2IfH0iARDu6ir_qsHS5OgWw=s96-c'
WHERE email = 'umidjonsaws@gmail.com' 
  AND user_id = '34db82a7-0937-4112-ab7d-60d2f0cac32e';

-- Now improve the handle_new_user function to better detect OAuth providers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Detect signup method from provider or metadata
  -- Check 'iss' field first (most reliable for OAuth), then 'provider', then metadata
  v_signup_method := CASE
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://accounts.google.com' THEN 'google'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN NEW.raw_user_meta_data ->> 'signup_method' IS NOT NULL THEN NEW.raw_user_meta_data ->> 'signup_method'
    ELSE 'email'
  END;
  
  -- Get avatar URL
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url)
    VALUES (
      NEW.id,
      v_display_name,
      NEW.email,
      v_signup_method,
      v_avatar_url
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;