
-- Fix check_and_reset_usage_limits with proper variable declaration
CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id uuid)
 RETURNS TABLE(can_generate boolean, remaining integer, limit_value integer, reset_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_image_limit INTEGER := 0;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_existing_count INTEGER := 0;
BEGIN
  -- Get user's active subscription with valid billing period
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND current_period_end > v_now;
  
  -- Determine image generation limit based on plan
  IF v_subscription.plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    v_image_limit := 0;
  END IF;
  
  -- Use Stripe's actual billing period
  IF v_subscription IS NOT NULL AND v_subscription.current_period_end IS NOT NULL THEN
    v_period_end := v_subscription.current_period_end;
    v_period_start := v_period_end - INTERVAL '30 days';
  ELSE
    v_period_end := v_now;
    v_period_start := v_now;
  END IF;
  
  -- Get current usage period matching billing cycle
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end = v_period_end
  LIMIT 1;
  
  -- If no matching period, create one and count existing images
  IF v_usage IS NULL THEN
    IF v_image_limit > 0 AND v_period_end > v_now THEN
      -- Count existing images in this period
      SELECT COUNT(DISTINCT m.id) INTO v_existing_count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = p_user_id
      AND m.role = 'assistant'
      AND m.file_attachments IS NOT NULL
      AND jsonb_array_length(m.file_attachments) > 0
      AND m.created_at >= v_period_start
      AND m.created_at < v_period_end
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(m.file_attachments) AS attachment
        WHERE attachment->>'url' LIKE '%generated-images%'
      );
      
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
        v_existing_count,
        v_image_limit
      )
      RETURNING * INTO v_usage;
      
      RAISE NOTICE 'Created usage period for user % with % existing images', p_user_id, v_existing_count;
    ELSE
      RETURN QUERY SELECT
        false AS can_generate,
        0 AS remaining,
        v_image_limit AS limit_value,
        v_period_end AS reset_date;
      RETURN;
    END IF;
  ELSIF v_usage.image_generations_limit != v_image_limit OR v_usage.period_start != v_period_start THEN
    -- Update limits while preserving usage
    UPDATE usage_limits
    SET 
      image_generations_limit = v_image_limit,
      period_start = v_period_start,
      period_end = v_period_end,
      updated_at = v_now
    WHERE user_id = p_user_id
    AND id = v_usage.id
    RETURNING * INTO v_usage;
    
    RAISE NOTICE 'Updated usage limit for user %', p_user_id;
  END IF;
  
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$function$;

-- Delete old record and recreate with correct count
DELETE FROM usage_limits WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';
SELECT check_and_reset_usage_limits('be9eedd1-0feb-4717-bbdf-13895b7f1e66');
