-- Add trial products to stripe_products table
INSERT INTO public.stripe_products (stripe_product_id, plan_tier, plan_name)
VALUES 
  ('prod_TIHYThP5XmWyWy', 'pro', 'Pro 3-Day Trial'),
  ('prod_TIHZLvUNMqIiCj', 'ultra_pro', 'Ultra Pro 3-Day Trial')
ON CONFLICT (stripe_product_id) 
DO UPDATE SET
  plan_tier = EXCLUDED.plan_tier,
  plan_name = EXCLUDED.plan_name,
  updated_at = now();

-- Add table to track trial-to-paid conversions
CREATE TABLE IF NOT EXISTS public.trial_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_subscription_id TEXT NOT NULL,
  trial_product_id TEXT NOT NULL,
  target_plan TEXT NOT NULL CHECK (target_plan IN ('pro', 'ultra_pro')),
  paid_subscription_id TEXT,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_conversions ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial conversions
CREATE POLICY "Users can view their own trial conversions"
ON public.trial_conversions
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update trial conversions
CREATE POLICY "Service role can manage trial conversions"
ON public.trial_conversions
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trial_conversions_user_id ON public.trial_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_trial_sub_id ON public.trial_conversions(trial_subscription_id);

-- Add updated_at trigger
CREATE TRIGGER update_trial_conversions_updated_at
  BEFORE UPDATE ON public.trial_conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();