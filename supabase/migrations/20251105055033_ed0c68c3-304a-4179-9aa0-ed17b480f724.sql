-- Add payment_tracked flag to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS payment_tracked BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_subscriptions.payment_tracked IS 'Tracks whether payment_complete event has been sent to Google Analytics for this subscription';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_tracked 
ON public.user_subscriptions(user_id, payment_tracked) 
WHERE payment_tracked = FALSE;