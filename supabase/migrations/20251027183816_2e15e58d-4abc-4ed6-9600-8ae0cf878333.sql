-- Add external_id column to profiles table for webhook tracking
ALTER TABLE public.profiles 
ADD COLUMN external_id text;