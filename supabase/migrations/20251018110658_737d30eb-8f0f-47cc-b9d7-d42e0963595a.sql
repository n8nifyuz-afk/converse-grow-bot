-- Update check_and_reset_usage_limits to use Stripe's billing periods instead of fixed 30-day periods
-- This ensures usage limits align perfectly with Stripe's actual billing cycles

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
  -- Get user's active subscription with valid billing period
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND current_period_end > v_now; -- Only subscriptions with future period end
  
  -- Determine image generation limit based on plan
  IF v_subscription.plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    v_image_limit := 0; -- Free plan or no active subscription
  END IF;
  
  -- CRITICAL: Use Stripe's actual billing period end date
  IF v_subscription IS NOT NULL AND v_subscription.current_period_end IS NOT NULL THEN
    v_period_end := v_subscription.current_period_end;
  ELSE
    -- No active subscription - free users cannot generate
    v_period_end := v_now;
  END IF;
  
  -- Clean up expired periods (period_end has passed)
  DELETE FROM usage_limits 
  WHERE user_id = p_user_id 
  AND period_end <= v_now;
  
  -- Get current active usage period
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end > v_now
  ORDER BY period_start DESC
  LIMIT 1;
  
  -- Handle period creation/updates
  IF v_usage IS NULL THEN
    -- No active period exists
    IF v_image_limit > 0 AND v_period_end > v_now THEN
      -- User has paid plan with valid billing period - create usage period
      -- This handles edge case where user subscribes but webhook hasn't fired yet
      INSERT INTO usage_limits (
        user_id,
        period_start,
        period_end,
        image_generations_used,
        image_generations_limit
      ) VALUES (
        p_user_id,
        v_now,
        v_period_end, -- Use Stripe's billing period end
        0,
        v_image_limit
      )
      RETURNING * INTO v_usage;
    ELSE
      -- Free user or expired subscription - cannot generate
      RETURN QUERY SELECT
        false AS can_generate,
        0 AS remaining,
        v_image_limit AS limit_value,
        v_period_end AS reset_date;
      RETURN;
    END IF;
  ELSIF v_usage.image_generations_limit != v_image_limit THEN
    -- Plan changed (upgrade/downgrade) - update limit but keep usage count
    -- This preserves usage when users change plans mid-period
    UPDATE usage_limits
    SET 
      image_generations_limit = v_image_limit,
      updated_at = v_now
    WHERE user_id = p_user_id
    AND id = v_usage.id
    RETURNING * INTO v_usage;
  END IF;
  
  -- Return current usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$$;