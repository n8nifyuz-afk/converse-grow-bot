-- Add current user as admin
INSERT INTO user_roles (user_id, role) 
VALUES ('86ac5a48-a3ce-41ef-bad1-b97c64b08b84', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;