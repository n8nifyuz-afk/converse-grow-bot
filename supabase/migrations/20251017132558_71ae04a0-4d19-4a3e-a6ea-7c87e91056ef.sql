-- Remove foreign key constraint from token_usage table
-- This allows token usage records to persist even after user deletion
-- for analytics and tracking purposes

ALTER TABLE public.token_usage 
DROP CONSTRAINT IF EXISTS token_usage_user_id_fkey;

-- Keep the index for performance but remove the foreign key reference
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id 
ON public.token_usage(user_id);

-- Add a comment to document why there's no foreign key
COMMENT ON COLUMN public.token_usage.user_id IS 'User ID reference (no foreign key to preserve data after user deletion)';
