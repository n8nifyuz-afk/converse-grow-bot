
-- Fix check_and_reset_usage_limits to use subscription's actual period dates
-- Instead of creating new periods with now(), use Stripe's billing cycle dates
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
  
  -- CRITICAL: Use Stripe's actual billing period, not arbitrary dates
  IF v_subscription IS NOT NULL AND v_subscription.current_period_end IS NOT NULL THEN
    v_period_end := v_subscription.current_period_end;
    -- Calculate period start as 30 days before period end (standard billing cycle)
    v_period_start := v_period_end - INTERVAL '30 days';
  ELSE
    -- No active subscription - free users cannot generate
    v_period_end := v_now;
    v_period_start := v_now;
  END IF;
  
  -- CRITICAL FIX: Don't delete expired periods - just check if current one is valid
  -- Get current active usage period
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end = v_period_end -- Match exact billing cycle
  LIMIT 1;
  
  -- Handle period creation/updates
  IF v_usage IS NULL THEN
    -- No matching period exists
    IF v_image_limit > 0 AND v_period_end > v_now THEN
      -- Create new usage period matching subscription billing cycle
      -- Count existing images in this period to preserve accurate count
      DECLARE
        v_existing_count INTEGER := 0;
      BEGIN
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
      END;
      
      INSERT INTO usage_limits (
        user_id,
        period_start,
        period_end,
        image_generations_used,
        image_generations_limit
      ) VALUES (
        p_user_id,
        v_period_start, -- Use calculated period start, not now()
        v_period_end,
        v_existing_count, -- Preserve existing image count
        v_image_limit
      )
      RETURNING * INTO v_usage;
      
      RAISE NOTICE 'Created new usage period for user % (limit: %, existing: %)', p_user_id, v_image_limit, v_existing_count;
    ELSE
      -- Free user or expired subscription - cannot generate
      RETURN QUERY SELECT
        false AS can_generate,
        0 AS remaining,
        v_image_limit AS limit_value,
        v_period_end AS reset_date;
      RETURN;
    END IF;
  ELSIF v_usage.image_generations_limit != v_image_limit OR v_usage.period_end != v_period_end THEN
    -- Plan changed or period updated - update limits while preserving usage count
    UPDATE usage_limits
    SET 
      image_generations_limit = v_image_limit,
      period_start = v_period_start,
      period_end = v_period_end,
      updated_at = v_now
    WHERE user_id = p_user_id
    AND id = v_usage.id
    RETURNING * INTO v_usage;
    
    RAISE NOTICE 'Updated usage limit for user % (new limit: %)', p_user_id, v_image_limit;
  END IF;
  
  -- Return current usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$function$;

-- Refresh usage for the user to apply the fix
SELECT check_and_reset_usage_limits('be9eedd1-0feb-4717-bbdf-13895b7f1e66');
