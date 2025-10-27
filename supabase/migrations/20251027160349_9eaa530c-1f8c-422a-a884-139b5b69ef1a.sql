-- Add trial conversion record for user hvjjj83@gmail.com who used trial but it wasn't tracked
-- This prevents them from seeing "3-Day Full Access" again in the pricing modal

INSERT INTO trial_conversions (
  user_id, 
  trial_subscription_id, 
  trial_product_id, 
  target_plan, 
  converted_at,
  created_at
) 
VALUES (
  '86ac5a48-a3ce-41ef-bad1-b97c64b08b84', 
  'legacy_trial_oct24', 
  'prod_TGqs5r2udThT0t', -- Ultra Pro product ID
  'ultra_pro', 
  NULL, -- Trial ended but didn't convert (payment failed)
  '2024-10-24 00:00:00+00' -- When they started the trial
)
ON CONFLICT DO NOTHING;