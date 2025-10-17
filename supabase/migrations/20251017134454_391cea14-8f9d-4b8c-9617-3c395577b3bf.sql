-- Create table for Stripe product mapping
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'pro', 'ultra_pro')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

-- Allow public read access for product mapping
CREATE POLICY "Public read access to stripe products"
ON public.stripe_products
FOR SELECT
USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage stripe products"
ON public.stripe_products
FOR ALL
USING (auth.role() = 'service_role');

-- Insert existing product mappings
INSERT INTO public.stripe_products (stripe_product_id, plan_name, plan_tier) VALUES
  ('prod_TFLbRE1wL9Miha', 'Pro', 'pro'),
  ('prod_TEx5Xda5BPBuHv', 'Pro', 'pro'),
  ('prod_TDSbGJB9U4Xt7b', 'Ultra Pro', 'ultra_pro'),
  ('prod_TDSHzExQNjyvJD', 'Ultra Pro', 'ultra_pro')
ON CONFLICT (stripe_product_id) DO NOTHING;

-- Create table for webhook event idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage webhook events
CREATE POLICY "Service role can manage webhook events"
ON public.stripe_webhook_events
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON public.stripe_webhook_events(stripe_event_id);

-- Add updated_at trigger to stripe_products
CREATE TRIGGER update_stripe_products_updated_at
  BEFORE UPDATE ON public.stripe_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();