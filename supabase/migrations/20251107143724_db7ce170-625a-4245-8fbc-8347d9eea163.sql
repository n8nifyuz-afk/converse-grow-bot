-- Fix RLS policies for trial_conversions table
-- This allows authenticated users to track their own trial usage
-- and prevents the "new row violates row-level security policy" error

-- Enable RLS on trial_conversions if not already enabled
ALTER TABLE public.trial_conversions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own trial conversions" ON public.trial_conversions;
DROP POLICY IF EXISTS "Users can view their own trial conversions" ON public.trial_conversions;
DROP POLICY IF EXISTS "Users can update their own trial conversions" ON public.trial_conversions;

-- Allow authenticated users to insert their own trial conversion records
CREATE POLICY "Users can insert their own trial conversions" 
ON public.trial_conversions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own trial conversion records
CREATE POLICY "Users can view their own trial conversions" 
ON public.trial_conversions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own trial conversion records
-- (Needed for when webhook updates the trial_subscription_id and converted_at)
CREATE POLICY "Users can update their own trial conversions" 
ON public.trial_conversions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Note: Service role automatically bypasses RLS, so webhook can update any record