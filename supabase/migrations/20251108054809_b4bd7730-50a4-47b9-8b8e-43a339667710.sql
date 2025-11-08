-- Fix subscription period_end for trial conversions
-- Calculate correct monthly period_end from subscription creation date
UPDATE user_subscriptions
SET 
  current_period_end = (created_at + INTERVAL '1 month'),
  updated_at = now()
WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924'
  AND stripe_subscription_id = 'sub_1SR4qyL8Zm4LqDn4Ivths5Wh'
  AND plan = 'pro'
  AND current_period_end < now(); -- Only update if period has already ended

-- Also update usage_limits to match
UPDATE usage_limits
SET 
  period_end = (
    SELECT created_at + INTERVAL '1 month'
    FROM user_subscriptions
    WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924'
  ),
  updated_at = now()
WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924';