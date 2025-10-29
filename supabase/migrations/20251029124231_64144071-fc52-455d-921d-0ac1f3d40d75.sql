-- Add cost column to token_usage table to avoid real-time calculations
ALTER TABLE public.token_usage
ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 6) DEFAULT 0;

-- Create index for faster cost aggregation queries
CREATE INDEX IF NOT EXISTS idx_token_usage_cost ON public.token_usage(cost);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_cost ON public.token_usage(user_id, cost);

-- Function to calculate token cost based on model and tokens
CREATE OR REPLACE FUNCTION public.calculate_token_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  input_price NUMERIC;
  output_price NUMERIC;
  calculated_cost NUMERIC;
BEGIN
  -- Model pricing per 1M tokens (in USD)
  CASE NEW.model
    -- GPT Models
    WHEN 'gpt-4o-mini' THEN
      input_price := 0.075;
      output_price := 0.30;
    WHEN 'gpt-4o', 'gpt-4o-latest' THEN
      input_price := 2.50;
      output_price := 10.00;
    WHEN 'gpt-5' THEN
      input_price := 30.00;
      output_price := 60.00;
    WHEN 'gpt-5-nano' THEN
      input_price := 0.05;
      output_price := 0.40;
    
    -- Claude Models
    WHEN 'claude-haiku-4.5' THEN
      input_price := 1.00;
      output_price := 5.00;
    
    -- Grok Models
    WHEN 'grok-4' THEN
      input_price := 3.00;
      output_price := 15.00;
    
    -- DeepSeek Models
    WHEN 'deepseek-chat', 'deepseek-v2' THEN
      input_price := 0.56;
      output_price := 1.68;
    WHEN 'deepseek-reasoner' THEN
      input_price := 0.14;
      output_price := 2.19;
    
    -- Gemini Models
    WHEN 'google/gemini-2.5-pro', 'gemini-2.5-pro' THEN
      input_price := 1.25;
      output_price := 5.00;
    WHEN 'google/gemini-2.5-flash', 'gemini-2.5-flash', 'google/gemini-flash', 'gemini-flash', 'google/gemini-2.0-flash-exp' THEN
      input_price := 0.30;
      output_price := 2.50;
    WHEN 'google/gemini-2.5-flash-lite', 'gemini-2.5-flash-lite' THEN
      input_price := 0.15;
      output_price := 1.00;
    
    -- Image Generation (output tokens store price * 100)
    WHEN 'generate-image', 'dall-e-3' THEN
      -- For image generation, output_tokens contains (price * 100)
      -- So we just divide by 100 to get the cost
      NEW.cost := (NEW.output_tokens::NUMERIC / 100.0);
      RETURN NEW;
    
    ELSE
      -- Unknown model, set cost to 0
      input_price := 0;
      output_price := 0;
  END CASE;
  
  -- Calculate cost: (input_tokens / 1M * input_price) + (output_tokens / 1M * output_price)
  calculated_cost := 
    (COALESCE(NEW.input_tokens, 0)::NUMERIC / 1000000.0 * input_price) + 
    (COALESCE(NEW.output_tokens, 0)::NUMERIC / 1000000.0 * output_price);
  
  NEW.cost := calculated_cost;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate cost on insert
DROP TRIGGER IF EXISTS calculate_cost_on_insert ON public.token_usage;
CREATE TRIGGER calculate_cost_on_insert
  BEFORE INSERT ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_token_cost();

-- Backfill existing records with calculated costs
-- This will take a moment but only needs to run once
UPDATE public.token_usage
SET cost = CASE
  -- Image generation models
  WHEN model IN ('generate-image', 'dall-e-3') THEN
    output_tokens::NUMERIC / 100.0
  
  -- GPT models
  WHEN model = 'gpt-4o-mini' THEN
    (input_tokens::NUMERIC / 1000000.0 * 0.075) + (output_tokens::NUMERIC / 1000000.0 * 0.30)
  WHEN model IN ('gpt-4o', 'gpt-4o-latest') THEN
    (input_tokens::NUMERIC / 1000000.0 * 2.50) + (output_tokens::NUMERIC / 1000000.0 * 10.00)
  WHEN model = 'gpt-5' THEN
    (input_tokens::NUMERIC / 1000000.0 * 30.00) + (output_tokens::NUMERIC / 1000000.0 * 60.00)
  WHEN model = 'gpt-5-nano' THEN
    (input_tokens::NUMERIC / 1000000.0 * 0.05) + (output_tokens::NUMERIC / 1000000.0 * 0.40)
  
  -- Claude models
  WHEN model = 'claude-haiku-4.5' THEN
    (input_tokens::NUMERIC / 1000000.0 * 1.00) + (output_tokens::NUMERIC / 1000000.0 * 5.00)
  
  -- Grok models
  WHEN model = 'grok-4' THEN
    (input_tokens::NUMERIC / 1000000.0 * 3.00) + (output_tokens::NUMERIC / 1000000.0 * 15.00)
  
  -- DeepSeek models
  WHEN model IN ('deepseek-chat', 'deepseek-v2') THEN
    (input_tokens::NUMERIC / 1000000.0 * 0.56) + (output_tokens::NUMERIC / 1000000.0 * 1.68)
  WHEN model = 'deepseek-reasoner' THEN
    (input_tokens::NUMERIC / 1000000.0 * 0.14) + (output_tokens::NUMERIC / 1000000.0 * 2.19)
  
  -- Gemini models
  WHEN model IN ('google/gemini-2.5-pro', 'gemini-2.5-pro') THEN
    (input_tokens::NUMERIC / 1000000.0 * 1.25) + (output_tokens::NUMERIC / 1000000.0 * 5.00)
  WHEN model IN ('google/gemini-2.5-flash', 'gemini-2.5-flash', 'google/gemini-flash', 'gemini-flash', 'google/gemini-2.0-flash-exp') THEN
    (input_tokens::NUMERIC / 1000000.0 * 0.30) + (output_tokens::NUMERIC / 1000000.0 * 2.50)
  WHEN model IN ('google/gemini-2.5-flash-lite', 'gemini-2.5-flash-lite') THEN
    (input_tokens::NUMERIC / 1000000.0 * 0.15) + (output_tokens::NUMERIC / 1000000.0 * 1.00)
  
  ELSE 0
END
WHERE cost = 0 OR cost IS NULL;

COMMENT ON COLUMN public.token_usage.cost IS 'Pre-calculated cost in USD based on model pricing';