-- Fix search_path for the functions we just created
DROP FUNCTION IF EXISTS public.increment_user_message_count(uuid, text);
DROP FUNCTION IF EXISTS public.reset_user_message_count(uuid);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.increment_user_message_count(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert or update the message count
  INSERT INTO public.user_message_usage (user_id, session_id, message_count)
  VALUES (p_user_id, p_session_id, 1)
  ON CONFLICT (user_id) 
  WHERE user_id IS NOT NULL
  DO UPDATE SET 
    message_count = user_message_usage.message_count + 1,
    updated_at = now()
  RETURNING message_count INTO v_count;
  
  -- Handle session_id conflicts separately
  IF v_count IS NULL AND p_session_id IS NOT NULL THEN
    INSERT INTO public.user_message_usage (user_id, session_id, message_count)
    VALUES (NULL, p_session_id, 1)
    ON CONFLICT (session_id)
    WHERE session_id IS NOT NULL
    DO UPDATE SET 
      message_count = user_message_usage.message_count + 1,
      updated_at = now()
    RETURNING message_count INTO v_count;
  END IF;
  
  RETURN v_count;
END;
$$;

-- Create function to reset message count (for subscription users or admin reset)
CREATE OR REPLACE FUNCTION public.reset_user_message_count(
  p_user_id UUID
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_message_usage
  SET 
    message_count = 0,
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;