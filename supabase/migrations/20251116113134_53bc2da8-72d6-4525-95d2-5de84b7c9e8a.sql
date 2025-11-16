-- Remove old admin
DELETE FROM user_roles 
WHERE user_id = '86ac5a48-a3ce-41ef-bad1-b97c64b08b84' 
AND role = 'admin';

-- Add new admin (ads@madtas.com)
INSERT INTO user_roles (user_id, role)
VALUES ('be64099a-34fb-41c0-82d2-a876c6a97332', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;