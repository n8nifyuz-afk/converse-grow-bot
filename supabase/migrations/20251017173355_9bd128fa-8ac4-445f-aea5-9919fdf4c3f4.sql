-- Update stripe_products with all live mode products
INSERT INTO public.stripe_products (stripe_product_id, plan_tier, plan_name)
VALUES 
  ('prod_TDSbGJB9U4Xt7b', 'ultra_pro', 'Ultra Pro'),
  ('prod_TDSHzExQNjyvJD', 'ultra_pro', 'Ultra Pro'),
  ('prod_TDSbUWLqR3bz7k', 'pro', 'Pro'),
  ('prod_TEx5Xda5BPBuHv', 'pro', 'Pro'),
  ('prod_TFjbArlYa9GMQr', 'pro', 'Pro')
ON CONFLICT (stripe_product_id) 
DO UPDATE SET
  plan_tier = EXCLUDED.plan_tier,
  plan_name = EXCLUDED.plan_name,
  updated_at = now();