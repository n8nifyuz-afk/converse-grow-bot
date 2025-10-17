-- Insert Daily plan product mapping for Stripe webhook processing
INSERT INTO public.stripe_products (stripe_product_id, plan_name, plan_tier)
VALUES ('prod_TFjbArlYa9GMQr', 'Daily', 'pro')
ON CONFLICT (stripe_product_id) 
DO UPDATE SET 
  plan_name = EXCLUDED.plan_name,
  plan_tier = EXCLUDED.plan_tier,
  updated_at = now();