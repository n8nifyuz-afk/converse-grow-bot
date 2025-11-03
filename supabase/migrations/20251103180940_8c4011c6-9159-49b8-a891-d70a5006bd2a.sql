-- Add IP address and country columns to email_verifications table
ALTER TABLE public.email_verifications
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;