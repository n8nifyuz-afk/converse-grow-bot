-- Backfill missing profiles for existing users
-- This creates profiles for users who signed up before the RLS fix

INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url)
SELECT 
  au.id as user_id,
  -- Extract display name from metadata
  COALESCE(
    au.raw_user_meta_data ->> 'display_name',
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    split_part(au.email, '@', 1),
    'User'
  ) as display_name,
  au.email,
  -- Detect signup method (fixed column name)
  CASE
    WHEN au.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN au.raw_user_meta_data ->> 'iss' = 'https://accounts.google.com' THEN 'google'
    WHEN au.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN au.raw_app_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN au.raw_user_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN au.raw_user_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN au.raw_user_meta_data ->> 'signup_method' IS NOT NULL THEN au.raw_user_meta_data ->> 'signup_method'
    ELSE 'email'
  END as signup_method,
  -- Get avatar URL
  COALESCE(
    au.raw_user_meta_data ->> 'avatar_url',
    au.raw_user_meta_data ->> 'picture',
    au.raw_user_meta_data ->> 'photo'
  ) as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.id IS NULL  -- Only users without profiles
ON CONFLICT (user_id) DO NOTHING;