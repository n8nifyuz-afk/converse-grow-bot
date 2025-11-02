
-- Delete orphaned subscriptions (subscriptions without profiles)
DELETE FROM user_subscriptions
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Delete duplicate subscriptions (keep only one per stripe_subscription_id)
DELETE FROM user_subscriptions
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY stripe_subscription_id ORDER BY created_at ASC) as rn
    FROM user_subscriptions
    WHERE stripe_subscription_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);
