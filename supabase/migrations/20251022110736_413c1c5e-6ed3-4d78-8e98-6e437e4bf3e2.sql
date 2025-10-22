-- Remove cheap Pro plan from stripe_products table
DELETE FROM stripe_products 
WHERE stripe_product_id = 'prod_THWfIRwAZHPr4s';