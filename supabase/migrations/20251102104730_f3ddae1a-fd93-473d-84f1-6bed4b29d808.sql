-- Fix the data: Set correct period_start and count images properly
UPDATE usage_limits
SET 
  period_start = (SELECT created_at FROM user_subscriptions WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66' AND status = 'active'),
  image_generations_used = (
    SELECT COUNT(DISTINCT m.id)
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    WHERE c.user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66'
    AND m.role = 'assistant'
    AND m.file_attachments IS NOT NULL
    AND jsonb_array_length(m.file_attachments) > 0
    AND m.created_at >= (SELECT created_at FROM user_subscriptions WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66' AND status = 'active')
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(m.file_attachments) AS att
      WHERE att->>'url' LIKE '%generated-images%'
    )
  ),
  updated_at = now()
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';

-- Fix the function: Only insert if not exists, don't overwrite period_start on reads
DROP FUNCTION IF EXISTS public.check_and_reset_usage_limits(uuid);

CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id uuid)
RETURNS TABLE(can_generate boolean, remaining integer, limit_value integer, reset_date timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub_plan TEXT;
  v_sub_period_end TIMESTAMP WITH TIME ZONE;
  v_sub_created TIMESTAMP WITH TIME ZONE;
  v_image_limit INTEGER := 0;
  v_usage RECORD;
BEGIN
  -- Get subscription info
  SELECT 
    us.plan,
    us.current_period_end,
    us.created_at
  INTO v_sub_plan, v_sub_period_end, v_sub_created
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  AND us.status = 'active'
  AND us.current_period_end > now();
  
  -- Determine limit based on plan
  IF v_sub_plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_sub_plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    RETURN QUERY SELECT false, 0, 0, now();
    RETURN;
  END IF;
  
  -- Get existing usage record
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id;
  
  -- Only insert if doesn't exist, never update period_start on reads
  IF v_usage IS NULL THEN
    INSERT INTO usage_limits (
      user_id,
      period_start,
      period_end,
      image_generations_used,
      image_generations_limit
    ) VALUES (
      p_user_id,
      v_sub_created,
      v_sub_period_end,
      0,
      v_image_limit
    )
    RETURNING * INTO v_usage;
  ELSE
    -- Just update the limits if they changed, but preserve period_start and usage count
    IF v_usage.image_generations_limit != v_image_limit OR v_usage.period_end != v_sub_period_end THEN
      UPDATE usage_limits
      SET 
        image_generations_limit = v_image_limit,
        period_end = v_sub_period_end,
        updated_at = now()
      WHERE user_id = p_user_id
      RETURNING * INTO v_usage;
    END IF;
  END IF;
  
  -- Return current status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$function$;