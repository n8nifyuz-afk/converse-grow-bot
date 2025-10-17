-- Fix the check_and_reset_usage_limits function to properly handle monthly resets for yearly subscriptions
DROP FUNCTION IF EXISTS public.check_and_reset_usage_limits(uuid);

CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id uuid)
RETURNS TABLE(can_generate boolean, remaining integer, limit_value integer, reset_date timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  -- This ensures yearly subscribers get monthly resets, not yearly resets
  v_period_end := v_now + interval '30 days';
  
  -- Get current usage period
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end > v_now
  ORDER BY period_start DESC
  LIMIT 1;
  
  -- Create new period if:
  -- 1. No active period exists
  -- 2. Plan changed (different limit)
  -- 3. Period expired
  IF v_usage IS NULL OR 
     v_usage.image_generations_limit != v_image_limit THEN
    
    -- Delete expired periods
    DELETE FROM usage_limits 
    WHERE user_id = p_user_id 
    AND period_end <= v_now;
    
    -- If plan changed mid-period, update the existing record
    IF v_usage IS NOT NULL AND 
       v_usage.period_end > v_now AND
       v_usage.image_generations_limit != v_image_limit THEN
      UPDATE usage_limits
      SET 
        image_generations_limit = v_image_limit,
        updated_at = now()
      WHERE user_id = p_user_id
      AND period_end > v_now
      RETURNING * INTO v_usage;
    ELSE
      -- Create new 30-day period
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
        0,
        v_image_limit
      )
      ON CONFLICT (user_id, period_start) 
      DO UPDATE SET
        period_end = EXCLUDED.period_end,
        image_generations_limit = EXCLUDED.image_generations_limit,
        updated_at = now()
      RETURNING * INTO v_usage;
    END IF;
  END IF;
  
  -- Return usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$$;