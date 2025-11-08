-- Create webhook_attempts table for tracking all webhook events
CREATE TABLE IF NOT EXISTS public.webhook_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'failed', 'retrying')),
  error_message TEXT,
  error_code TEXT,
  request_payload JSONB,
  response_payload JSONB,
  user_id UUID,
  customer_email TEXT,
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_retry_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  max_retries INTEGER NOT NULL DEFAULT 5,
  UNIQUE(stripe_event_id, attempt_number)
);

-- Create index for efficient querying of failed webhooks
CREATE INDEX idx_webhook_attempts_status ON public.webhook_attempts(status);
CREATE INDEX idx_webhook_attempts_next_retry ON public.webhook_attempts(next_retry_at) WHERE status = 'failed';
CREATE INDEX idx_webhook_attempts_event_id ON public.webhook_attempts(stripe_event_id);
CREATE INDEX idx_webhook_attempts_user_id ON public.webhook_attempts(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.webhook_attempts ENABLE ROW LEVEL SECURITY;

-- Service role can manage all webhook attempts
CREATE POLICY "Service role can manage webhook attempts"
ON public.webhook_attempts
FOR ALL
USING (auth.role() = 'service_role');

-- Admins can view all webhook attempts
CREATE POLICY "Admins can view all webhook attempts"
ON public.webhook_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own webhook attempts
CREATE POLICY "Users can view their own webhook attempts"
ON public.webhook_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_webhook_attempts_updated_at
BEFORE UPDATE ON public.webhook_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate next retry time with exponential backoff
CREATE OR REPLACE FUNCTION public.calculate_next_retry(
  p_attempt_number INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Exponential backoff: 5min, 15min, 45min, 2h, 6h
  RETURN now() + INTERVAL '1 minute' * (POWER(3, p_attempt_number - 1) * 5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE public.webhook_attempts IS 'Tracks all Stripe webhook attempts with retry logic and failure tracking';
COMMENT ON FUNCTION public.calculate_next_retry IS 'Calculates next retry time using exponential backoff (5min, 15min, 45min, 2h, 6h)';