-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cleanup of expired usage_limits records
-- Runs daily at 2:00 AM UTC to clean up expired periods
SELECT cron.schedule(
  'cleanup-expired-usage-limits',
  '0 2 * * *', -- Daily at 2:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/cleanup-usage-limits',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);