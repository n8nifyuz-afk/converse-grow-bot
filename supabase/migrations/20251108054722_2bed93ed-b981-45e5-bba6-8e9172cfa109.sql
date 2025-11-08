-- Fix subscription period end for user who converted from trial to paid
-- The webhook set the wrong period_end during trial conversion
UPDATE user_subscriptions
SET 
  current_period_end = '2025-12-08 05:40:35+00',
  updated_at = now()
WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924'
  AND stripe_subscription_id = 'sub_1SR4qyL8Zm4LqDn4Ivths5Wh';