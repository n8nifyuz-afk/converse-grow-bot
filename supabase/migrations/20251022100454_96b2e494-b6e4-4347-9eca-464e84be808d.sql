-- Remove user blocking functionality completely

-- 1. Drop RLS policies that check for blocked users
DROP POLICY IF EXISTS "Blocked users cannot access chats" ON chats;
DROP POLICY IF EXISTS "Blocked users cannot access messages" ON messages;
DROP POLICY IF EXISTS "Blocked users cannot access token usage" ON token_usage;

-- 2. Drop admin policy for updating blocked status
DROP POLICY IF EXISTS "Admins can update user blocked status" ON profiles;

-- 3. Drop the blocked column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS blocked;

-- 4. Drop the check_user_not_blocked trigger function (if it exists)
DROP FUNCTION IF EXISTS check_user_not_blocked() CASCADE;