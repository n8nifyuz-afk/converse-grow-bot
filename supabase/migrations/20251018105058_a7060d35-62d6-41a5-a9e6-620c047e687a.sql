-- Create a table to track user message usage (persists even when messages/chats are deleted)
CREATE TABLE IF NOT EXISTS public.user_message_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(session_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_message_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own usage" 
ON public.user_message_usage 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can update their own usage" 
ON public.user_message_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
ON public.user_message_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

-- Create function to increment message count
CREATE OR REPLACE FUNCTION public.increment_user_message_count(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset message count (for subscription users or admin reset)
CREATE OR REPLACE FUNCTION public.reset_user_message_count(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_message_usage
  SET 
    message_count = 0,
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_message_usage_updated_at
BEFORE UPDATE ON public.user_message_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_message_usage_user_id ON public.user_message_usage(user_id);
CREATE INDEX idx_user_message_usage_session_id ON public.user_message_usage(session_id);