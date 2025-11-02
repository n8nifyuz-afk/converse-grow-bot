-- Fix both functions to preserve period_start from subscription.created_at

-- 1. Fix increment_image_generation to use subscription created_at, not now()
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
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_updated INTEGER;
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND current_period_end > now();
  
  IF v_subscription.plan = 'pro' THEN
    v_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_limit := 2000;
  ELSE
    RETURN false;
  END IF;
  
  v_period_end := v_subscription.current_period_end;
  v_period_start := v_subscription.created_at; -- Use subscription start, not now()
  
  -- Insert or update, preserving period_start
  INSERT INTO usage_limits (
    user_id,
    period_start,
    period_end,
    image_generations_used,
    image_generations_limit
  ) VALUES (
    p_user_id,
    v_period_start,
    v_period_end,
    1,
    v_limit
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    image_generations_used = CASE
      WHEN usage_limits.period_end != v_period_end THEN 1
      WHEN usage_limits.image_generations_used >= usage_limits.image_generations_limit THEN usage_limits.image_generations_used
      ELSE usage_limits.image_generations_used + 1
    END,
    image_generations_limit = v_limit,
    period_end = v_period_end,
    -- CRITICAL: Only update period_start if period changed, otherwise preserve it
    period_start = CASE
      WHEN usage_limits.period_end != v_period_end THEN v_period_start
      ELSE usage_limits.period_start
    END,
    updated_at = now()
  WHERE usage_limits.image_generations_used < usage_limits.image_generations_limit
  RETURNING image_generations_used INTO v_updated;
  
  IF v_updated IS NULL OR v_updated > v_limit THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- 2. Restore the correct data for current user
UPDATE usage_limits 
SET 
  period_start = (SELECT created_at FROM user_subscriptions WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66' AND status = 'active'),
  image_generations_used = 3
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';