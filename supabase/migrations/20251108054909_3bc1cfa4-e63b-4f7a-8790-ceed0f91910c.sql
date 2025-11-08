-- Force update subscription period_end for user with expired trial
-- The webhook incorrectly set period_end to trial end instead of monthly billing period
DO $$
DECLARE
  v_new_period_end timestamp with time zone;
BEGIN
  -- Calculate new period_end as 1 month from subscription creation
  SELECT created_at + INTERVAL '1 month' INTO v_new_period_end
  FROM user_subscriptions
  WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924';
  
  -- Update subscription
  UPDATE user_subscriptions
  SET 
    current_period_end = v_new_period_end,
    updated_at = now()
  WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924';
  
  -- Update usage limits to match
  UPDATE usage_limits
  SET 
    period_end = v_new_period_end,
    updated_at = now()
  WHERE user_id = '719d4300-8907-4a27-ae5d-75d481921924';
  
  RAISE NOTICE 'Updated subscription period_end to: %', v_new_period_end;
END $$;