-- Fix anonymous_messages RLS policy to properly restrict by session_id
DROP POLICY IF EXISTS "Users can view messages from their session" ON public.anonymous_messages;

CREATE POLICY "Users can view their own session messages"
ON public.anonymous_messages
FOR SELECT
USING (session_id = current_setting('request.headers', true)::json->>'x-session-id');

-- Create rate limiting table for signup attempts
CREATE TABLE IF NOT EXISTS public.signup_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or IP address
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_signup_rate_limits_identifier ON public.signup_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_signup_rate_limits_blocked ON public.signup_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS on rate limiting table
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.signup_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to check and increment rate limits
CREATE OR REPLACE FUNCTION public.check_signup_rate_limit(
  p_identifier TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 60,
  p_block_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_is_blocked BOOLEAN := false;
  v_remaining INTEGER;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM signup_rate_limits
  WHERE identifier = p_identifier
  FOR UPDATE;
  
  -- Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', v_record.blocked_until,
      'reason', 'Too many attempts. Please try again later.'
    );
  END IF;
  
  -- Reset if outside window
  IF v_record.id IS NULL OR v_record.first_attempt_at < v_window_start THEN
    INSERT INTO signup_rate_limits (identifier, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (p_identifier, 1, now(), now())
    ON CONFLICT (identifier) 
    DO UPDATE SET
      attempt_count = 1,
      first_attempt_at = now(),
      last_attempt_at = now(),
      blocked_until = NULL,
      updated_at = now()
    RETURNING * INTO v_record;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'attempts', 1,
      'remaining', p_max_attempts - 1
    );
  END IF;
  
  -- Increment attempt count
  UPDATE signup_rate_limits
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = now(),
    blocked_until = CASE 
      WHEN attempt_count + 1 >= p_max_attempts 
      THEN now() + (p_block_minutes || ' minutes')::INTERVAL
      ELSE NULL
    END,
    updated_at = now()
  WHERE identifier = p_identifier
  RETURNING * INTO v_record;
  
  v_remaining := GREATEST(0, p_max_attempts - v_record.attempt_count);
  
  -- Check if should be blocked
  IF v_record.attempt_count >= p_max_attempts THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', v_record.blocked_until,
      'attempts', v_record.attempt_count,
      'reason', format('Too many attempts (%s). Blocked until %s', v_record.attempt_count, v_record.blocked_until)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'blocked', false,
    'attempts', v_record.attempt_count,
    'remaining', v_remaining
  );
END;
$$;

-- Add unique constraint on identifier
CREATE UNIQUE INDEX IF NOT EXISTS idx_signup_rate_limits_identifier_unique ON public.signup_rate_limits(identifier);