-- Restore correct usage again after webhook reset
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