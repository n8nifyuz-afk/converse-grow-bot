
-- FINAL FIX: Simplify the logic - just use subscription created_at directly
-- No complex calculations needed
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
  v_used INTEGER;
BEGIN
  -- Get subscription info in one query
  SELECT 
    us.plan,
    us.current_period_end,
    us.created_at
  INTO v_sub_plan, v_sub_period_end, v_sub_created
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  AND us.status = 'active'
  AND us.current_period_end > now();
  
  -- Determine limit
  IF v_sub_plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_sub_plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    -- No subscription
    RETURN QUERY SELECT false, 0, 0, now();
    RETURN;
  END IF;
  
  -- Get or create usage record
  INSERT INTO usage_limits (
    user_id,
    period_start,
    period_end,
    image_generations_used,
    image_generations_limit
  ) VALUES (
    p_user_id,
    v_sub_created, -- Use subscription start
    v_sub_period_end,
    0,
    v_image_limit
  )
  ON CONFLICT (user_id) DO UPDATE SET
    image_generations_limit = v_image_limit,
    period_start = v_sub_created, -- Always use subscription start
    period_end = v_sub_period_end,
    updated_at = now()
  RETURNING image_generations_used INTO v_used;
  
  -- Return status
  RETURN QUERY SELECT
    v_used < v_image_limit AS can_generate,
    v_image_limit - v_used AS remaining,
    v_image_limit AS limit_value,
    v_sub_period_end AS reset_date;
END;
$function$;

-- Force sync by deleting and recreating
DELETE FROM usage_limits WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';

-- Manually set correct usage count based on actual images
INSERT INTO usage_limits (user_id, period_start, period_end, image_generations_used, image_generations_limit)
SELECT 
  'be9eedd1-0feb-4717-bbdf-13895b7f1e66',
  us.created_at,
  us.current_period_end,
  (SELECT COUNT(DISTINCT m.id)
   FROM messages m
   JOIN chats c ON m.chat_id = c.id  
   WHERE c.user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66'
   AND m.role = 'assistant'
   AND m.file_attachments IS NOT NULL
   AND jsonb_array_length(m.file_attachments) > 0
   AND m.created_at >= us.created_at
   AND EXISTS (
     SELECT 1 FROM jsonb_array_elements(m.file_attachments) AS att
     WHERE att->>'url' LIKE '%generated-images%'
   )),
  500
FROM user_subscriptions us
WHERE us.user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66'
AND us.status = 'active';
