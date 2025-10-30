-- Create user_cost_summary table for fast cost lookups
CREATE TABLE IF NOT EXISTS public.user_cost_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_cost NUMERIC DEFAULT 0,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_cost_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all cost summaries"
  ON public.user_cost_summary
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own cost summary"
  ON public.user_cost_summary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage cost summaries"
  ON public.user_cost_summary
  FOR ALL
  USING (auth.role() = 'service_role'::text);

-- Create trigger function to update cost summary when token usage is inserted
CREATE OR REPLACE FUNCTION public.update_user_cost_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update the user's cost summary
  INSERT INTO public.user_cost_summary (
    user_id,
    total_cost,
    total_input_tokens,
    total_output_tokens,
    last_updated
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.cost, 0),
    COALESCE(NEW.input_tokens, 0),
    COALESCE(NEW.output_tokens, 0),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_cost = user_cost_summary.total_cost + COALESCE(NEW.cost, 0),
    total_input_tokens = user_cost_summary.total_input_tokens + COALESCE(NEW.input_tokens, 0),
    total_output_tokens = user_cost_summary.total_output_tokens + COALESCE(NEW.output_tokens, 0),
    last_updated = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger on token_usage table
CREATE TRIGGER trigger_update_cost_summary
  AFTER INSERT ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_cost_summary();

-- Backfill existing data (aggregate all historical token usage)
INSERT INTO public.user_cost_summary (user_id, total_cost, total_input_tokens, total_output_tokens, last_updated)
SELECT 
  user_id,
  COALESCE(SUM(cost), 0) as total_cost,
  COALESCE(SUM(input_tokens), 0) as total_input_tokens,
  COALESCE(SUM(output_tokens), 0) as total_output_tokens,
  now() as last_updated
FROM public.token_usage
GROUP BY user_id
ON CONFLICT (user_id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_cost_summary_user_id ON public.user_cost_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cost_summary_total_cost ON public.user_cost_summary(total_cost DESC);