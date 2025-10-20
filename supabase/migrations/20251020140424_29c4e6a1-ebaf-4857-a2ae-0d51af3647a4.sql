-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cleanup-expired-subscriptions to run daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-expired-subscriptions-daily',
  '0 3 * * *', -- Run at 3:00 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/cleanup-expired-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule cleanup-usage-limits to run every hour at 5 minutes past the hour
SELECT cron.schedule(
  'cleanup-usage-limits-hourly',
  '5 * * * *', -- Run at 5 minutes past every hour
  $$
  SELECT
    net.http_post(
        url:='https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/cleanup-usage-limits',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Verify cron jobs were created
SELECT jobid, schedule, command, active
FROM cron.job
WHERE jobname IN ('cleanup-expired-subscriptions-daily', 'cleanup-usage-limits-hourly');