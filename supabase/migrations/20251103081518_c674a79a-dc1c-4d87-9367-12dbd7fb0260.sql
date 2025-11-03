-- Fix send-subscriber-webhook call in handle_new_user trigger
-- Remove Authorization header since function is now public (verify_jwt = false)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
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
  v_is_new_signup BOOLEAN;
  v_gclid TEXT;
  v_url_params TEXT;
  v_referer TEXT;
BEGIN
  -- Determine if this is a new signup (INSERT) or existing user update (UPDATE)
  v_is_new_signup := (TG_OP = 'INSERT');
  
  -- Log the incoming metadata for debugging
  RAISE NOTICE 'User event: % - ID: %, Email: %, Phone: %', TG_OP, NEW.id, NEW.email, NEW.phone;
  
  -- Extract phone number from auth.users
  v_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  
  -- Extract display name - this is for NEW signups only
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
  
  -- Detect signup method
  v_signup_method := CASE
    WHEN NEW.phone IS NOT NULL AND NEW.email IS NULL THEN 'phone'
    WHEN v_phone IS NOT NULL AND NEW.email IS NULL THEN 'phone'
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
  
  -- Extract tracking parameters
  v_gclid := NEW.raw_user_meta_data ->> 'gclid';
  v_url_params := NEW.raw_user_meta_data ->> 'url_params';
  v_referer := NEW.raw_user_meta_data ->> 'referer';
  
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
    gclid,
    url_params,
    initial_referer,
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
    v_gclid,
    v_url_params,
    v_referer,
    NEW.created_at
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = CASE
      WHEN profiles.display_name IS NOT NULL 
        AND profiles.display_name NOT LIKE 'User %' 
        AND length(profiles.display_name) > 5
      THEN profiles.display_name
      ELSE COALESCE(EXCLUDED.display_name, profiles.display_name)
    END,
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
    gclid = COALESCE(EXCLUDED.gclid, profiles.gclid),
    url_params = COALESCE(EXCLUDED.url_params, profiles.url_params),
    initial_referer = COALESCE(EXCLUDED.initial_referer, profiles.initial_referer),
    login_count = profiles.login_count + 1,
    last_login_at = now(),
    updated_at = now();
  
  RAISE NOTICE 'Successfully created/updated profile for user % with method %', NEW.id, v_signup_method;
  
  -- Send subscriber webhook ONLY on new signups (INSERT)
  IF v_is_new_signup THEN
    RAISE NOTICE '📤 Sending subscriber webhook for NEW user %', NEW.id;
    
    PERFORM
      net.http_post(
        url := 'https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/send-subscriber-webhook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'userId', NEW.id::text,
          'email', NEW.email,
          'username', v_display_name,
          'ipAddress', v_ip_address,
          'country', v_country,
          'signupMethod', v_signup_method,
          'gclid', v_gclid,
          'urlParams', v_url_params,
          'referer', v_referer
        )
      );
    
    RAISE NOTICE '✅ Subscriber webhook sent for user %', NEW.id;
  END IF;
  
  -- CRITICAL: Restore subscription if user has active Stripe subscription (handles account deletion + re-registration)
  -- This runs asynchronously and won't block the signup process
  IF v_is_new_signup AND NEW.email IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := 'https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/restore-user-subscription',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'userId', NEW.id::text,
          'userEmail', NEW.email
        )
      );
    
    RAISE NOTICE 'Subscription restoration check initiated for user %', NEW.id;
  END IF;
  
  -- Send welcome email only on INSERT (new signups), NOT on UPDATE (logins)
  IF v_is_new_signup AND v_signup_method != 'phone' AND NEW.email IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := 'https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'userId', NEW.id::text,
          'userEmail', NEW.email,
          'userName', v_display_name
        )
      );
    
    RAISE NOTICE 'Welcome email request sent for NEW user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)', 
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;