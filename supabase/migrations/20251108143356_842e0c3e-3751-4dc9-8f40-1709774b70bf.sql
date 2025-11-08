-- Fix security warning: Set search_path for calculate_next_retry function
DROP FUNCTION IF EXISTS public.calculate_next_retry(INTEGER);

CREATE OR REPLACE FUNCTION public.calculate_next_retry(
  p_attempt_number INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE 
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Exponential backoff: 5min, 15min, 45min, 2h, 6h
  RETURN now() + INTERVAL '1 minute' * (POWER(3, p_attempt_number - 1) * 5);
END;
$$;

COMMENT ON FUNCTION public.calculate_next_retry IS 'Calculates next retry time using exponential backoff (5min, 15min, 45min, 2h, 6h)';