-- Backfill existing users who don't have profiles yet (especially Apple sign-in users)
INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data ->> 'display_name',
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    split_part(au.email, '@', 1),
    'User'
  ) as display_name,
  au.email,
  CASE
    WHEN au.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN au.raw_user_meta_data ->> 'iss' = 'https://accounts.google.com' THEN 'google'
    WHEN au.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN au.raw_app_meta_data ->> 'provider' = 'apple' THEN 'apple'
    ELSE 'email'
  END as signup_method,
  COALESCE(
    au.raw_user_meta_data ->> 'avatar_url',
    au.raw_user_meta_data ->> 'picture',
    au.raw_user_meta_data ->> 'photo'
  ) as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;