
-- Restore accidentally deleted subscription for umidjonsaws@gmail.com
-- This subscription exists in Stripe but was removed from our database

INSERT INTO user_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  product_id,
  plan,
  plan_name,
  status,
  current_period_end,
  created_at,
  updated_at
)
VALUES (
  'f246fbfb-da17-4eb9-9a11-8bd4bce4632f',
  'cus_TLIzk02CySCwlD',
  'sub_1SOcNvL8Zm4LqDn4tKT5kSOx',
  'prod_TGqs5r2udThT0t', -- Ultra Pro product ID
  'ultra_pro',
  'Ultra Pro',
  'active',
  '2025-11-04 10:49:34+00',
  '2025-11-01 10:50:19.136681+00',
  now()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  product_id = EXCLUDED.product_id,
  plan = EXCLUDED.plan,
  plan_name = EXCLUDED.plan_name,
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = now();

-- Also restore usage limits
INSERT INTO usage_limits (
  user_id,
  period_start,
  period_end,
  image_generations_used,
  image_generations_limit,
  created_at,
  updated_at
)
VALUES (
  'f246fbfb-da17-4eb9-9a11-8bd4bce4632f',
  '2025-11-01 10:50:19.136681+00',
  '2025-11-04 10:49:34+00',
  0,
  2000, -- Ultra Pro gets 2000 images
  '2025-11-01 10:50:19.136681+00',
  now()
)
ON CONFLICT (user_id)
DO UPDATE SET
  image_generations_limit = 2000,
  period_end = EXCLUDED.period_end,
  updated_at = now();
