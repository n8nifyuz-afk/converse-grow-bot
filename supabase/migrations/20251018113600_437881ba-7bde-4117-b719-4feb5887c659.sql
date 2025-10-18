-- Fix double reset gaps and improve check_and_reset_usage_limits function
-- This update makes the function more defensive against race conditions

CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id uuid)
RETURNS TABLE(can_generate boolean, remaining integer, limit_value integer, reset_date timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_image_limit INTEGER := 0;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's active subscription with valid billing period
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND current_period_end > v_now; -- Only subscriptions with future period end
  
  -- Determine image generation limit based on plan
  IF v_subscription.plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    v_image_limit := 0; -- Free plan or no active subscription
  END IF;
  
  -- CRITICAL: Use Stripe's actual billing period end date
  IF v_subscription IS NOT NULL AND v_subscription.current_period_end IS NOT NULL THEN
    v_period_end := v_subscription.current_period_end;
  ELSE
    -- No active subscription - free users cannot generate
    v_period_end := v_now;
  END IF;
  
  -- CRITICAL FIX: Add 1-minute grace period when cleaning up expired periods
  -- This prevents race conditions with webhook/cron jobs
  DELETE FROM usage_limits 
  WHERE user_id = p_user_id 
  AND period_end < (v_now - INTERVAL '1 minute');
  
  -- Get current active usage period
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end > v_now
  ORDER BY period_start DESC
  LIMIT 1;
  
  -- Handle period creation/updates
  IF v_usage IS NULL THEN
    -- No active period exists
    IF v_image_limit > 0 AND v_period_end > v_now THEN
      -- User has paid plan with valid billing period - create usage period
      -- This handles edge case where user subscribes but webhook hasn't fired yet
      INSERT INTO usage_limits (
        user_id,
        period_start,
        period_end,
        image_generations_used,
        image_generations_limit
      ) VALUES (
        p_user_id,
        v_now,
        v_period_end, -- Use Stripe's billing period end
        0,
        v_image_limit
      )
      RETURNING * INTO v_usage;
      
      RAISE NOTICE 'Created new usage period for user % (limit: %)', p_user_id, v_image_limit;
    ELSE
      -- Free user or expired subscription - cannot generate
      RETURN QUERY SELECT
        false AS can_generate,
        0 AS remaining,
        v_image_limit AS limit_value,
        v_period_end AS reset_date;
      RETURN;
    END IF;
  ELSIF v_usage.image_generations_limit != v_image_limit THEN
    -- Plan changed (upgrade/downgrade) - update limit but keep usage count
    -- This preserves usage when users change plans mid-period
    UPDATE usage_limits
    SET 
      image_generations_limit = v_image_limit,
      period_end = v_period_end, -- Update period end to match subscription
      updated_at = v_now
    WHERE user_id = p_user_id
    AND id = v_usage.id
    RETURNING * INTO v_usage;
    
    RAISE NOTICE 'Updated usage limit for user % (new limit: %)', p_user_id, v_image_limit;
  END IF;
  
  -- Return current usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$$;

-- Update cron schedule to stagger timing and prevent conflicts
-- First, unschedule existing jobs if they exist
SELECT cron.unschedule('cleanup-expired-usage-limits') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-usage-limits'
);

SELECT cron.unschedule('invoke-function-every-minute') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'invoke-function-every-minute'
);

-- Schedule cleanup-expired-subscriptions at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup-expired-subscriptions-daily',
  '0 2 * * *', -- Daily at 2:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/cleanup-expired-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule cleanup-usage-limits at 2:30 AM UTC (30 minutes later to stagger)
SELECT cron.schedule(
  'cleanup-usage-limits-daily',
  '30 2 * * *', -- Daily at 2:30 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/cleanup-usage-limits',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Remove orphaned database functions that are never called
DROP FUNCTION IF EXISTS public.cleanup_expired_usage_periods();
DROP FUNCTION IF EXISTS public.cleanup_free_user_image_usage();