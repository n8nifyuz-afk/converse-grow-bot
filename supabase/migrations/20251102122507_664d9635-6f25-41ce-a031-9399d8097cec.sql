
-- Fix subscription ownership for users who deleted and recreated accounts

-- 1. Transfer muydinovumidjon17@gmail.com subscription to NEW user ID
--    Old user_id: dd205e9d-d830-4b76-965e-cf63ee42365a (deleted account)
--    New user_id: ef24a1fa-467b-44cb-b527-69d8d0ca41d4 (current account)

DO $$
DECLARE
  v_old_user_id UUID := 'dd205e9d-d830-4b76-965e-cf63ee42365a';
  v_new_user_id UUID := 'ef24a1fa-467b-44cb-b527-69d8d0ca41d4';
BEGIN
  -- Check if subscription exists for old user
  IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = v_old_user_id) THEN
    RAISE NOTICE 'Transferring subscription from old user % to new user %', v_old_user_id, v_new_user_id;
    
    -- Transfer subscription to new user ID
    UPDATE user_subscriptions
    SET 
      user_id = v_new_user_id,
      updated_at = now()
    WHERE user_id = v_old_user_id;
    
    -- Also transfer usage_limits if they exist
    UPDATE usage_limits
    SET user_id = v_new_user_id
    WHERE user_id = v_old_user_id;
    
    RAISE NOTICE 'Subscription transferred successfully';
  ELSE
    RAISE NOTICE 'No subscription found for old user %', v_old_user_id;
  END IF;
END $$;

-- 2. Create function to automatically restore subscriptions when users recreate accounts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after profile creation
DROP TRIGGER IF EXISTS auto_restore_subscription_trigger ON profiles;
CREATE TRIGGER auto_restore_subscription_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION restore_subscription_on_account_recreation();
