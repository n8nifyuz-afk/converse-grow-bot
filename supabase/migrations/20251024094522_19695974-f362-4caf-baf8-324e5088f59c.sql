-- Fix Ultra Pro subscription with incorrect period_end and create missing usage_limits
-- This is a one-time fix for existing subscriptions

DO $$
DECLARE
  v_user_id uuid := '86ac5a48-a3ce-41ef-bad1-b97c64b08b84';
  v_subscription_created timestamp with time zone;
  v_correct_period_end timestamp with time zone;
BEGIN
  -- Get the subscription creation time
  SELECT created_at INTO v_subscription_created
  FROM user_subscriptions
  WHERE user_id = v_user_id;
  
  -- Calculate correct period_end (3 days from creation for trial)
  v_correct_period_end := v_subscription_created + INTERVAL '3 days';
  
  -- Update the subscription with correct period_end
  UPDATE user_subscriptions
  SET 
    current_period_end = v_correct_period_end,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RAISE NOTICE 'Updated subscription for user % with period_end: %', v_user_id, v_correct_period_end;
  
  -- Delete any expired usage_limits
  DELETE FROM usage_limits 
  WHERE user_id = v_user_id 
  AND period_end < now();
  
  -- Create usage_limits if they don't exist
  INSERT INTO usage_limits (
    user_id,
    period_start,
    period_end,
    image_generations_used,
    image_generations_limit
  )
  VALUES (
    v_user_id,
    v_subscription_created,
    v_correct_period_end,
    0,
    2000  -- Ultra Pro limit
  )
  ON CONFLICT (user_id, period_start) DO UPDATE
  SET
    period_end = v_correct_period_end,
    image_generations_limit = 2000,
    updated_at = now();
  
  RAISE NOTICE 'Created/updated usage_limits for user %', v_user_id;
END $$;