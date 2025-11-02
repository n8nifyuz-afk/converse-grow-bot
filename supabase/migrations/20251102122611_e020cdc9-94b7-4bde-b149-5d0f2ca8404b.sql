
-- Fix security warning: Add search_path to the restoration function
CREATE OR REPLACE FUNCTION restore_subscription_on_account_recreation()
RETURNS TRIGGER AS $$
DECLARE
  v_old_subscription RECORD;
BEGIN
  -- When a new user is created, check if there's an orphaned subscription with same email
  SELECT us.* INTO v_old_subscription
  FROM user_subscriptions us
  LEFT JOIN auth.users au ON us.user_id = au.id
  WHERE au.id IS NULL -- Old user doesn't exist in auth.users
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = NEW.id 
      AND p.email = (
        SELECT p2.email FROM profiles p2 WHERE p2.user_id = us.user_id LIMIT 1
      )
    )
  LIMIT 1;
  
  IF v_old_subscription.user_id IS NOT NULL THEN
    RAISE NOTICE 'Auto-restoring subscription for recreated account: % -> %', v_old_subscription.user_id, NEW.id;
    
    -- Transfer subscription
    UPDATE user_subscriptions
    SET 
      user_id = NEW.id,
      updated_at = now()
    WHERE user_id = v_old_subscription.user_id;
    
    -- Transfer usage limits
    UPDATE usage_limits
    SET user_id = NEW.id
    WHERE user_id = v_old_subscription.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
