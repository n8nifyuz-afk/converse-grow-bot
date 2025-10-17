-- Add daily Pro subscription product to stripe_products table
INSERT INTO public.stripe_products (stripe_product_id, plan_tier, plan_name)
VALUES ('prod_TFjbArlYa9GMQr', 'pro', 'Pro')
ON CONFLICT (stripe_product_id) 
DO UPDATE SET 
  plan_tier = 'pro',
  plan_name = 'Pro',
  updated_at = now();