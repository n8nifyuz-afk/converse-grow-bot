-- Add blocked field to profiles and create blocking system
-- Step 1: Add blocked column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create index for faster blocked user queries
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON public.profiles(blocked) WHERE blocked = true;

-- Step 3: Create RLS policy to block access for blocked users
-- This prevents blocked users from accessing ANY data
CREATE POLICY "Blocked users cannot access profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND blocked = true
  )
);

-- Step 4: Apply blocking to all tables with RLS
-- Block access to chats
CREATE POLICY "Blocked users cannot access chats"
ON public.chats
FOR ALL
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND blocked = true
  )
);

-- Block access to messages
CREATE POLICY "Blocked users cannot access messages"
ON public.messages
FOR ALL
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND blocked = true
  )
);

-- Block access to token_usage
CREATE POLICY "Blocked users cannot access token usage"
ON public.token_usage
FOR ALL
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND blocked = true
  )
);

-- Step 5: Add admin policies to manage blocked users
CREATE POLICY "Admins can update user blocked status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));