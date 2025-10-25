-- Enable pg_net extension for making HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing function to recreate it
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with email sending
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
  v_ip_address TEXT;
  v_country TEXT;
  v_phone TEXT;
  v_locale TEXT;
  v_gender TEXT;
  v_request_id bigint;
  v_supabase_url TEXT := 'https://lciaiunzacgvvbvcshdh.supabase.co';
  v_service_key TEXT;
BEGIN
  -- Get service role key from vault or use a placeholder
  BEGIN
    v_service_key := current_setting('supabase.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_service_key := '';
  END;

  -- Log the incoming metadata for debugging
  RAISE NOTICE 'New user signup - ID: %, Email: %', NEW.id, NEW.email;
  
  -- Extract display name with better fallback chain
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'preferred_username',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Detect signup method
  v_signup_method := CASE
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://accounts.google.com' THEN 'google'
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN NEW.raw_user_meta_data ->> 'iss' LIKE '%google%' THEN 'google'
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'microsoft' THEN 'microsoft'
    WHEN NEW.raw_app_meta_data ->> 'provider' = 'azure' THEN 'microsoft'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'microsoft' THEN 'microsoft'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'azure' THEN 'microsoft'
    WHEN NEW.raw_user_meta_data ->> 'iss' LIKE '%microsoft%' THEN 'microsoft'
    WHEN NEW.raw_user_meta_data ->> 'iss' LIKE '%windows.net%' THEN 'microsoft'
    WHEN NEW.raw_user_meta_data ->> 'iss' LIKE '%microsoftonline%' THEN 'microsoft'
    WHEN NEW.raw_user_meta_data ->> 'signup_method' IS NOT NULL THEN NEW.raw_user_meta_data ->> 'signup_method'
    ELSE 'email'
  END;
  
  -- Extract avatar/picture URL
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NEW.raw_user_meta_data ->> 'photo',
    NEW.raw_user_meta_data ->> 'avatar'
  );
  
  -- Extract additional OAuth data
  v_ip_address := NEW.raw_user_meta_data ->> 'ip_address';
  v_country := NEW.raw_user_meta_data ->> 'country';
  v_phone := NEW.raw_user_meta_data ->> 'phone_number';
  v_locale := COALESCE(
    NEW.raw_user_meta_data ->> 'locale',
    NEW.raw_user_meta_data ->> 'language',
    NEW.raw_user_meta_data ->> 'lang'
  );
  v_gender := NEW.raw_user_meta_data ->> 'gender';
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    email, 
    signup_method, 
    avatar_url, 
    ip_address, 
    country,
    phone_number,
    locale,
    gender,
    oauth_provider,
    oauth_metadata,
    login_count,
    last_login_at,
    created_at
  )
  VALUES (
    NEW.id,
    v_display_name,
    NEW.email,
    v_signup_method,
    v_avatar_url,
    v_ip_address,
    v_country,
    v_phone,
    v_locale,
    v_gender,
    v_signup_method,
    NEW.raw_user_meta_data,
    1,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    signup_method = COALESCE(EXCLUDED.signup_method, profiles.signup_method),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    ip_address = COALESCE(EXCLUDED.ip_address, profiles.ip_address),
    country = COALESCE(EXCLUDED.country, profiles.country),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    locale = COALESCE(EXCLUDED.locale, profiles.locale),
    gender = COALESCE(EXCLUDED.gender, profiles.gender),
    oauth_metadata = COALESCE(EXCLUDED.oauth_metadata, profiles.oauth_metadata),
    oauth_provider = COALESCE(EXCLUDED.oauth_provider, profiles.oauth_provider),
    login_count = profiles.login_count + 1,
    last_login_at = now(),
    updated_at = now();
  
  -- Send welcome email asynchronously via edge function using pg_net
  IF v_service_key != '' THEN
    BEGIN
      SELECT net.http_post(
        url := v_supabase_url || '/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object(
          'email', NEW.email,
          'user_id', NEW.id,
          'display_name', v_display_name
        )
      ) INTO v_request_id;
      
      RAISE NOTICE 'Welcome email request sent for user % (request_id: %)', NEW.id, v_request_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the signup
      RAISE WARNING 'Failed to send welcome email for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RAISE NOTICE 'Successfully created/updated profile for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)', 
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();