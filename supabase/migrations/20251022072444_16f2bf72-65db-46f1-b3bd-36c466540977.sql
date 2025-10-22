-- Fix: Add RLS policy to allow trigger/webhook to create profiles
-- This allows service role and system operations to bypass the auth.uid() check

-- First, let's add a policy that allows service role to insert profiles
CREATE POLICY "Service role can create profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also allow the trigger function to insert by checking if it's a system operation
-- The trigger runs as the function owner with SECURITY DEFINER
CREATE POLICY "System can create profiles for new users"
ON public.profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (
  -- Allow if no current session (trigger context) or if user_id matches
  auth.uid() IS NULL OR auth.uid() = user_id
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;