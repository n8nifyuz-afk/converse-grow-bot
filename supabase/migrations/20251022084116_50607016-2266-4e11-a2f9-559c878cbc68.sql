-- Clean up stale subscription for ads@madtas.com
-- This subscription was canceled in Stripe at 2025-10-21 20:52:50 but webhook didn't process

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id for ads@madtas.com
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE email = 'ads@madtas.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Delete the stale subscription
    DELETE FROM user_subscriptions
    WHERE user_id = v_user_id
    AND stripe_subscription_id = 'sub_1SKc1ZL8Zm4LqDn4D26gVj89';
    
    -- Delete usage limits (user downgrade to free)
    DELETE FROM usage_limits
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Cleaned up stale subscription for user %', v_user_id;
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;