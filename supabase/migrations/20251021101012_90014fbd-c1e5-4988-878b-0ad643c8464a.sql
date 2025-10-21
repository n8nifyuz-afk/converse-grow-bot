-- Add unique constraint on user_id for usage_limits
ALTER TABLE usage_limits
ADD CONSTRAINT usage_limits_user_id_key UNIQUE (user_id);

-- Update existing Pro users to have correct limits
UPDATE usage_limits ul
SET 
  image_generations_limit = CASE 
    WHEN us.plan = 'ultra_pro' THEN 2000
    WHEN us.plan = 'pro' THEN 500
    ELSE 0
  END,
  period_end = us.current_period_end,
  updated_at = now()
FROM user_subscriptions us
WHERE ul.user_id = us.user_id
  AND us.status = 'active'
  AND us.plan IN ('pro', 'ultra_pro')
  AND ul.image_generations_limit = 0;