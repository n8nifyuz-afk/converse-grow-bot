-- Update Daily plan display name to clarify it's a Pro plan
UPDATE public.stripe_products 
SET plan_name = 'Daily Pro' 
WHERE stripe_product_id = 'prod_TFjbArlYa9GMQr';