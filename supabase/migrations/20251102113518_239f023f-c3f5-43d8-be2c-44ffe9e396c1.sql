-- Fix usage_limits that was reset by restore-user-subscription
-- Restore correct period_start and actual image usage count

UPDATE usage_limits 
SET 
  -- Fix period_start to subscription's actual created_at
  period_start = (
    SELECT created_at 
    FROM user_subscriptions 
    WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66' 
    AND status = 'active'
    ORDER BY created_at ASC
    LIMIT 1
  ),
  -- Restore actual image usage (should be 3, not 0)
  image_generations_used = (
    SELECT COUNT(DISTINCT m.id)
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    WHERE c.user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66'
    AND m.role = 'assistant'
    AND m.file_attachments IS NOT NULL
    AND jsonb_array_length(m.file_attachments) > 0
    AND m.created_at >= (
      SELECT created_at 
      FROM user_subscriptions 
      WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66' 
      AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 1
    )
    AND EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(m.file_attachments) AS att
      WHERE att->>'url' LIKE '%generated-images%'
    )
  ),
  updated_at = now()
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';