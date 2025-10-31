-- Add welcome_email_sent column to profiles table to prevent duplicate welcome emails
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false;

-- Set welcome_email_sent to true for existing users (they've already been using the app)
UPDATE public.profiles 
SET welcome_email_sent = true 
WHERE created_at < NOW();