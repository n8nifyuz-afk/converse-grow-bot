-- Remove referrer column from user_activity_logs table
ALTER TABLE public.user_activity_logs DROP COLUMN IF EXISTS referrer;