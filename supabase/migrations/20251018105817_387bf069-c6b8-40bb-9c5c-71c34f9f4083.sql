-- Fix the check_and_reset_usage_limits function to properly reset expired periods
DROP FUNCTION IF EXISTS public.check_and_reset_usage_limits(uuid);

CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id uuid)
RETURNS TABLE(can_generate boolean, remaining integer, limit_value integer, reset_date timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_image_limit INTEGER := 0;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';
  
  -- Determine image generation limit based on plan
  IF v_subscription.plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    v_image_limit := 0; -- Free plan has no image generation
  END IF;
  
  -- CRITICAL FIX: Always use 30-day periods for image generation
  v_period_end := v_now + interval '30 days';
  
  -- Get current usage period
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end > v_now
  ORDER BY period_start DESC
  LIMIT 1;
  
  -- CRITICAL FIX: Delete ALL expired periods (not just checking one)
  DELETE FROM usage_limits 
  WHERE user_id = p_user_id 
  AND period_end <= v_now;
  
  -- CRITICAL FIX: If no active period OR plan changed OR period expired, create/update
  IF v_usage IS NULL OR 
     v_usage.image_generations_limit != v_image_limit OR
     v_usage.period_end <= v_now THEN
    
    -- Delete any remaining old records for this user
    DELETE FROM usage_limits 
    WHERE user_id = p_user_id;
    
    -- Create new 30-day period with correct limit
    INSERT INTO usage_limits (
      user_id,
      period_start,
      period_end,
      image_generations_used,
      image_generations_limit
    ) VALUES (
      p_user_id,
      v_now,
      v_period_end,
      0, -- RESET to 0
      v_image_limit
    )
    RETURNING * INTO v_usage;
  END IF;
  
  -- Return usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$$;

-- Add a cleanup function to reset free users who have usage but shouldn't
CREATE OR REPLACE FUNCTION public.cleanup_free_user_image_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset image usage for free users (those with limit = 0 but have used > 0)
  UPDATE usage_limits
  SET 
    image_generations_used = 0,
    updated_at = now()
  WHERE image_generations_limit = 0
  AND image_generations_used > 0;
  
  RAISE NOTICE 'Cleaned up % free user records', (SELECT COUNT(*) FROM usage_limits WHERE image_generations_limit = 0 AND image_generations_used > 0);
END;
$$;

-- Run the cleanup immediately
SELECT public.cleanup_free_user_image_usage();