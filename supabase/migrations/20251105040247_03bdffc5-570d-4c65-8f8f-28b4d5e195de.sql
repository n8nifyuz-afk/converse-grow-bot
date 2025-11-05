-- Fix handle_new_user to NEVER send webhook for phone signups
-- Only send-profile-complete-webhook should send the webhook for phone users

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
  v_is_new_signup BOOLEAN;
  v_gclid TEXT;
  v_url_params JSONB;
  v_referer TEXT;
  v_is_oauth BOOLEAN;
  v_cloudflare_response TEXT;
  v_trace_data TEXT[];
  v_trace_line TEXT;
BEGIN
  v_is_new_signup := (TG_OP = 'INSERT');
  
  RAISE NOTICE 'User event: % - ID: %, Email: %, Phone: %', TG_OP, NEW.id, NEW.email, NEW.phone;
  
  v_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  
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
  
  v_is_oauth := v_signup_method IN ('google', 'apple', 'microsoft');
  
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture',
    NEW.raw_user_meta_data ->> 'photo',
    NEW.raw_user_meta_data ->> 'avatar'
  );
  
  v_ip_address := NEW.raw_user_meta_data ->> 'ip_address';
  v_country := NEW.raw_user_meta_data ->> 'country';
  
  IF v_country IS NULL AND v_ip_address IS NOT NULL AND v_ip_address != '' THEN
    BEGIN
      SELECT content::text INTO v_cloudflare_response
      FROM net.http_get('https://www.cloudflare.com/cdn-cgi/trace');
      
      IF v_cloudflare_response IS NOT NULL THEN
        v_trace_data := string_to_array(v_cloudflare_response, E'\n');
        
        FOREACH v_trace_line IN ARRAY v_trace_data
        LOOP
          IF v_trace_line LIKE 'loc=%' THEN
            v_country := upper(split_part(v_trace_line, '=', 2));
            RAISE NOTICE '🌍 Auto-detected country from IP: % for user %', v_country, NEW.id;
            EXIT;
          END IF;
        END LOOP;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Country detection failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  v_locale := COALESCE(
    NEW.raw_user_meta_data ->> 'locale',
    NEW.raw_user_meta_data ->> 'language',
    NEW.raw_user_meta_data ->> 'lang'
  );
  v_gender := NEW.raw_user_meta_data ->> 'gender';
  v_gclid := NEW.raw_user_meta_data ->> 'gclid';
  v_referer := NEW.raw_user_meta_data ->> 'referer';
  
  BEGIN
    IF NEW.raw_user_meta_data ? 'url_params' THEN
      v_url_params := NEW.raw_user_meta_data -> 'url_params';
      
      IF jsonb_typeof(v_url_params) = 'string' THEN
        BEGIN
          v_url_params := to_jsonb((v_url_params #>> '{}')::jsonb);
        EXCEPTION WHEN OTHERS THEN
          v_url_params := jsonb_build_object('raw', v_url_params #>> '{}');
        END;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error processing url_params: %', SQLERRM;
    v_url_params := NULL;
  END;
  
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
  
  RAISE NOTICE 'Successfully created/updated profile for user % with method % and country %', NEW.id, v_signup_method, v_country;
  
  -- CRITICAL: NEVER send webhook for phone signups - only send-profile-complete-webhook does this
  -- Only send webhook for email signups immediately
  IF v_is_new_signup AND v_signup_method = 'email' AND NEW.email IS NOT NULL THEN
    RAISE NOTICE '📤 Sending subscriber webhook for NEW email user %', NEW.id;
    
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
          'urlParams', COALESCE(v_url_params, '{}'::jsonb),
          'referer', v_referer
        )
      );
    
    RAISE NOTICE '✅ Subscriber webhook sent for email user %', NEW.id;
  ELSIF v_is_new_signup AND v_signup_method = 'phone' THEN
    RAISE NOTICE '⏭️ SKIPPING webhook for phone user % - will be sent ONLY after profile completion', NEW.id;
  ELSIF v_is_new_signup AND v_is_oauth THEN
    RAISE NOTICE '⏭️ SKIPPING webhook for OAuth user % - will be sent after GCLID sync', NEW.id;
  END IF;
  
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
$function$;