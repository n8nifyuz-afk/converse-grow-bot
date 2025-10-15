-- Clean up old test subscription data
-- This will remove any subscription records that reference old test product IDs

-- Delete subscriptions with old test product IDs
DELETE FROM user_subscriptions 
WHERE product_id IN (
  'prod_TDSeCiQ2JEFnWB',  -- Old Pro test product
  'prod_TDSfAtaWP5KbhM'   -- Old Ultra Pro test product
);

-- Update any subscriptions with NULL product_id to inactive status
UPDATE user_subscriptions
SET status = 'inactive'
WHERE product_id IS NULL 
  AND status = 'active';

-- Comment: This migration cleans up old test subscription data
-- New live product IDs:
-- Pro Daily: prod_TExAqVXMsTfeDA
-- Pro Monthly: prod_TDSbUWLqR3bz7k  
-- Pro Yearly: prod_TEx5Xda5BPBuHv
-- Ultra Pro Monthly: prod_TDSbGJB9U4Xt7b
-- Ultra Pro Yearly: prod_TDSHzExQNjyvJD