-- Delete user with phone number 998900679575 (user_id: a22e575d-34e3-419b-a257-eeace0bf96a8)

-- Delete messages through chat_id
DELETE FROM message_ratings WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8');
DELETE FROM image_analyses WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM chats WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM projects WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM usage_limits WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM user_subscriptions WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM user_roles WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM token_usage WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';
DELETE FROM profiles WHERE user_id = 'a22e575d-34e3-419b-a257-eeace0bf96a8';