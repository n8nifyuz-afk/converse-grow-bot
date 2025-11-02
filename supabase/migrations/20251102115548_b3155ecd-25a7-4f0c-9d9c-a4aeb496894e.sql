
-- CRITICAL FIX: Remove the fraudulent subscription that wasn't deleted before
-- This user (n8nify.uz@gmail.com / Apple account) should NOT have access to 
-- muydinovumidjon17@gmail.com's paid subscription

-- First, verify what we're deleting
DO $$
DECLARE
  v_user_email TEXT;
  v_stripe_customer TEXT;
BEGIN
  SELECT p.email, us.stripe_customer_id INTO v_user_email, v_stripe_customer
  FROM user_subscriptions us
  JOIN profiles p ON us.user_id = p.user_id
  WHERE us.user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';
  
  RAISE NOTICE 'Deleting subscription for user: %, Stripe customer: %', v_user_email, v_stripe_customer;
END $$;

-- Delete usage limits first (foreign key dependency)
DELETE FROM usage_limits 
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';

-- Delete the fraudulent subscription
DELETE FROM user_subscriptions 
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66'
  AND stripe_customer_id = 'cus_TKxsf4z6DovqYU';

-- Verify deletion
DO $$
DECLARE
  v_remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO v_remaining_count
  FROM user_subscriptions
  WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';
  
  RAISE NOTICE 'Remaining subscriptions for this user: %', v_remaining_count;
END $$;
