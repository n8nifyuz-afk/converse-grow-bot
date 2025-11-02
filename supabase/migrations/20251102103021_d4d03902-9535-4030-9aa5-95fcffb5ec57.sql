
-- Function to sync image generation usage with actual generated images
-- This counts images from messages and updates the usage_limits table
CREATE OR REPLACE FUNCTION public.sync_image_usage_from_messages(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_image_count INTEGER;
  v_period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the current period start from usage_limits
  SELECT period_start INTO v_period_start
  FROM usage_limits
  WHERE user_id = p_user_id;
  
  IF v_period_start IS NULL THEN
    RAISE NOTICE 'No usage limits found for user %', p_user_id;
    RETURN;
  END IF;
  
  -- Count generated images in current period
  SELECT COUNT(DISTINCT m.id) INTO v_image_count
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE c.user_id = p_user_id
  AND m.role = 'assistant'
  AND m.file_attachments IS NOT NULL
  AND jsonb_array_length(m.file_attachments) > 0
  AND m.created_at >= v_period_start
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(m.file_attachments) AS attachment
    WHERE attachment->>'url' LIKE '%generated-images%'
  );
  
  -- Update usage_limits with actual count
  UPDATE usage_limits
  SET 
    image_generations_used = v_image_count,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RAISE NOTICE 'Synced % images for user %', v_image_count, p_user_id;
END;
$function$;

-- Run sync for the user with incorrect count
SELECT sync_image_usage_from_messages('be9eedd1-0feb-4717-bbdf-13895b7f1e66');
