-- Update the handle_new_user function to properly detect phone authentication
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
  v_ip_address TEXT;
  v_country TEXT;
  v_phone TEXT;
  v_locale TEXT;
  v_gender TEXT;
BEGIN
  -- Log the incoming metadata for debugging
  RAISE NOTICE 'New user signup - ID: %, Email: %, Phone: %', NEW.id, NEW.email, NEW.phone;
  
  -- Extract phone number from auth.users
  v_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  
  -- Extract display name
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'preferred_username',
    CASE 
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      WHEN v_phone IS NOT NULL THEN 'User ' || substring(v_phone from length(v_phone) - 3)
      ELSE 'User'
    END
  );
  
  -- Detect signup method - UPDATED TO INCLUDE PHONE
  v_signup_method := CASE
    -- Check for phone authentication FIRST
    WHEN NEW.phone IS NOT NULL AND NEW.email IS NULL THEN 'phone'
    WHEN v_phone IS NOT NULL AND NEW.email IS NULL THEN 'phone'
    -- Then check OAuth providers
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
  
  -- Extract additional data
  v_ip_address := NEW.raw_user_meta_data ->> 'ip_address';
  v_country := NEW.raw_user_meta_data ->> 'country';
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
    CASE WHEN v_signup_method IN ('google', 'apple', 'microsoft') THEN v_signup_method ELSE NULL END,
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
  
  RAISE NOTICE 'Successfully created/updated profile for user % with method %', NEW.id, v_signup_method;
  
  -- Send welcome email only for email signups (not phone)
  IF v_signup_method != 'phone' AND NEW.email IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := 'https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub', true)
        ),
        body := jsonb_build_object(
          'userId', NEW.id::text,
          'userEmail', NEW.email,
          'userName', v_display_name
        )
      );
    
    RAISE NOTICE 'Welcome email request sent for user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)', 
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;