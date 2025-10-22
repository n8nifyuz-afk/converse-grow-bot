-- Drop the problematic policy that causes infinite recursion
-- The "Blocked users cannot access profiles" policy queries the profiles table
-- while being applied TO the profiles table, causing infinite recursion
DROP POLICY IF EXISTS "Blocked users cannot access profiles" ON public.profiles;

-- The blocking logic is already handled at the application level:
-- 1. AuthContext checks if user is blocked and logs them out
-- 2. AuthModal prevents login if user is blocked
-- 3. Other tables (chats, messages, token_usage) have their own blocking policies