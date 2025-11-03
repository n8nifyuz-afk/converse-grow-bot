-- Add tracking columns to email_verifications table
ALTER TABLE public.email_verifications
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS url_params JSONB,
ADD COLUMN IF NOT EXISTS initial_referer TEXT;