-- Fix race condition in usage limits by improving increment logic

-- Drop and recreate increment_image_generation with better locking
DROP FUNCTION IF EXISTS public.increment_image_generation(uuid);

CREATE OR REPLACE FUNCTION public.increment_image_generation(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limit INTEGER;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_updated INTEGER;
  v_subscription RECORD;
BEGIN
  -- Get user's active subscription to determine limit
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND current_period_end > now();
  
  -- Determine image generation limit based on plan
  IF v_subscription.plan = 'pro' THEN
    v_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_limit := 2000;
  ELSE
    -- No active subscription - cannot generate
    RAISE NOTICE 'User % has no active subscription', p_user_id;
    RETURN false;
  END IF;
  
  v_period_end := v_subscription.current_period_end;
  
  -- CRITICAL: Use INSERT ... ON CONFLICT to ensure atomic operation
  -- This prevents race conditions with check_and_reset_usage_limits
  INSERT INTO usage_limits (
    user_id,
    period_start,
    period_end,
    image_generations_used,
    image_generations_limit
  ) VALUES (
    p_user_id,
    now(),
    v_period_end,
    1, -- Start with 1 since this is a generation
    v_limit
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    image_generations_used = CASE
      -- If period has changed, reset to 1
      WHEN usage_limits.period_end != v_period_end THEN 1
      -- If at limit, don't increment (will return false)
      WHEN usage_limits.image_generations_used >= usage_limits.image_generations_limit THEN usage_limits.image_generations_used
      -- Otherwise increment
      ELSE usage_limits.image_generations_used + 1
    END,
    image_generations_limit = v_limit,
    period_end = v_period_end,
    period_start = CASE
      WHEN usage_limits.period_end != v_period_end THEN now()
      ELSE usage_limits.period_start
    END,
    updated_at = now()
  WHERE usage_limits.image_generations_used < usage_limits.image_generations_limit
  RETURNING image_generations_used INTO v_updated;
  
  -- Check if we successfully incremented
  IF v_updated IS NULL OR v_updated > v_limit THEN
    RAISE NOTICE 'User % at generation limit', p_user_id;
    RETURN false;
  END IF;
  
  RAISE NOTICE 'Successfully incremented for user % to %/%', p_user_id, v_updated, v_limit;
  RETURN true;
END;
$function$;