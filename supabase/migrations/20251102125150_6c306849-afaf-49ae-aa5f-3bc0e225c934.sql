
-- Clean up refunded subscription for umidjonsaws@gmail.com (confirmed refund in Stripe on Nov 2, 2025)
-- Subscription: sub_1SOcNvL8Zm4LqDn4tKT5kSOx (Ultra Pro - €0.99 refunded)

-- 1. Delete the refunded subscription record
DELETE FROM user_subscriptions
WHERE user_id = 'f246fbfb-da17-4eb9-9a11-8bd4bce4632f'
  AND stripe_subscription_id = 'sub_1SOcNvL8Zm4LqDn4tKT5kSOx'
  AND stripe_customer_id = 'cus_TLIzk02CySCwlD';

-- 2. Reset usage limits to free tier (0 image generations)
DELETE FROM usage_limits
WHERE user_id = 'f246fbfb-da17-4eb9-9a11-8bd4bce4632f';

-- Verification query to confirm cleanup
SELECT 
  'After cleanup' as status,
  (SELECT COUNT(*) FROM user_subscriptions WHERE user_id = 'f246fbfb-da17-4eb9-9a11-8bd4bce4632f') as subscription_count,
  (SELECT COUNT(*) FROM usage_limits WHERE user_id = 'f246fbfb-da17-4eb9-9a11-8bd4bce4632f') as usage_limit_count;
