
-- Remove fraudulent subscription from n8nify.uz@gmail.com
-- This user should NOT have access to muydinovumidjon17@gmail.com's subscription

DELETE FROM usage_limits 
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';

DELETE FROM user_subscriptions 
WHERE user_id = 'be9eedd1-0feb-4717-bbdf-13895b7f1e66';
