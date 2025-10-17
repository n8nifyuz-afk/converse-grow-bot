-- Backfill missing profiles for existing users
INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data ->> 'display_name',
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(u.email, '@', 1),
    'User'
  ) as display_name,
  u.email,
  CASE
    WHEN u.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN u.raw_user_meta_data ->> 'iss' = 'https://accounts.google.com' THEN 'google'
    WHEN u.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN u.raw_app_meta_data ->> 'provider' = 'apple' THEN 'apple'
    ELSE 'email'
  END as signup_method,
  COALESCE(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture',
    u.raw_user_meta_data ->> 'photo'
  ) as avatar_url
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;