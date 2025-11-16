-- Grant Pro subscription to ads@madtas.com (admin complimentary)
INSERT INTO user_subscriptions (
  user_id,
  plan,
  plan_name,
  status,
  product_id,
  current_period_end,
  stripe_customer_id,
  stripe_subscription_id
) VALUES (
  'be64099a-34fb-41c0-82d2-a876c6a97332',
  'pro',
  'Pro (Admin Complimentary)',
  'active',
  '3a522373-7387-4ed1-9b7e-7f0b18544372',
  NOW() + INTERVAL '10 years',
  'admin_complimentary',
  'admin_complimentary'
)
ON CONFLICT (user_id) 
DO UPDATE SET
  plan = 'pro',
  plan_name = 'Pro (Admin Complimentary)',
  status = 'active',
  product_id = '3a522373-7387-4ed1-9b7e-7f0b18544372',
  current_period_end = NOW() + INTERVAL '10 years',
  updated_at = NOW();

-- Set up usage limits for Pro plan (500 image generations)
INSERT INTO usage_limits (
  user_id,
  period_start,
  period_end,
  image_generations_used,
  image_generations_limit
) VALUES (
  'be64099a-34fb-41c0-82d2-a876c6a97332',
  NOW(),
  NOW() + INTERVAL '10 years',
  0,
  500
)
ON CONFLICT (user_id)
DO UPDATE SET
  image_generations_limit = 500,
  period_end = NOW() + INTERVAL '10 years',
  updated_at = NOW();