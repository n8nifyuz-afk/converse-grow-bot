-- Ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule if already exists
SELECT cron.unschedule('retry-failed-webhooks') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'retry-failed-webhooks'
);

-- Schedule retry-failed-webhooks to run every 10 minutes
-- Exponential backoff: 5min, 15min, 45min, 2h, 6h
SELECT cron.schedule(
  'retry-failed-webhooks',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
        url:='https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/retry-failed-webhooks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);