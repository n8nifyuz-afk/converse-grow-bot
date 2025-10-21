-- Backfill missing profiles for existing users
INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, created_at, updated_at, signup_method)
SELECT 
  gen_random_uuid() as id,
  au.id as user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as display_name,
  au.email,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.created_at,
  au.created_at as updated_at,
  CASE 
    WHEN au.raw_user_meta_data->>'provider' IS NOT NULL THEN au.raw_user_meta_data->>'provider'
    ELSE 'email'
  END as signup_method
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;