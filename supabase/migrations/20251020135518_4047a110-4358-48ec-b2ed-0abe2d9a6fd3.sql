-- Remove old product IDs and insert new ones
DELETE FROM public.stripe_products 
WHERE stripe_product_id IN (
  'prod_TFjbArlYa9GMQr',
  'prod_TDSbUWLqR3bz7k', 
  'prod_TEx5Xda5BPBuHv',
  'prod_TDSbGJB9U4Xt7b',
  'prod_TDSHzExQNjyvJD',
  'prod_TFLbRE1wL9Miha'
);

-- Insert new Pro plan products
INSERT INTO public.stripe_products (stripe_product_id, plan_tier, plan_name)
VALUES 
  ('prod_TGqk9k16XhvCIn', 'pro', 'Pro'),        -- Pro Monthly
  ('prod_TGqo8h59qNKZ4m', 'pro', 'Pro'),        -- Pro 3-Month
  ('prod_TGqqoPGWQJ0T4a', 'pro', 'Pro'),        -- Pro Yearly
  ('prod_TGqs5r2udThT0t', 'ultra_pro', 'Ultra Pro'),  -- Ultra Pro Monthly
  ('prod_TGquGexHO44m4T', 'ultra_pro', 'Ultra Pro'),  -- Ultra Pro 3-Month
  ('prod_TGqwVIWObYLt6U', 'ultra_pro', 'Ultra Pro')   -- Ultra Pro Yearly
ON CONFLICT (stripe_product_id) 
DO UPDATE SET
  plan_tier = EXCLUDED.plan_tier,
  plan_name = EXCLUDED.plan_name,
  updated_at = now();