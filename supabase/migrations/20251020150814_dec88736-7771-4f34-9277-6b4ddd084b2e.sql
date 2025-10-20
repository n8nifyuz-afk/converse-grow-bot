-- Update the Pro Monthly product ID in stripe_products table
-- This updates the product ID to match the new Stripe product
UPDATE stripe_products 
SET stripe_product_id = 'prod_TGsOnuDkIh9hVG'
WHERE stripe_product_id = 'prod_TGqk9k16XhvCIn' 
AND plan_name = 'Pro';