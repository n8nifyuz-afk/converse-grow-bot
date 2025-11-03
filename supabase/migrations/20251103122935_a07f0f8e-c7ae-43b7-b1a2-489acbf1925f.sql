-- Fix foreign key constraint to handle deleted users gracefully
ALTER TABLE user_activity_logs 
DROP CONSTRAINT IF EXISTS user_activity_logs_user_id_fkey;

ALTER TABLE user_activity_logs 
ADD CONSTRAINT user_activity_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add index for better performance on activity queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id_created 
ON user_activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type 
ON user_activity_logs(activity_type, created_at DESC);