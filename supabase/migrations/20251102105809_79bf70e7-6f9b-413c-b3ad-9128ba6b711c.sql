-- Final fix: Restore correct usage data
UPDATE usage_limits 
SET 
  period_start = (SELECT created_at FROM user_subscriptions WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66' AND status = 'active'),
  image_generations_used = 3,
  updated_at = now()
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';