-- Clean up email from unlinked account
UPDATE profiles 
SET email = NULL, updated_at = now() 
WHERE user_id = 'dd205e9d-d830-4b76-965e-cf63ee42365a' 
AND email = 'muydinovumidjon17@gmail.com';