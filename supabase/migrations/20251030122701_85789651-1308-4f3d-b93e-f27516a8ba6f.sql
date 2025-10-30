-- Clean up IP addresses in profiles table
-- Remove proxy IPs and keep only the client IP (first IP in comma-separated list)
UPDATE profiles
SET ip_address = SPLIT_PART(ip_address, ',', 1)
WHERE ip_address IS NOT NULL 
  AND ip_address LIKE '%,%';

-- Clean up IP addresses in user_activity_logs table
UPDATE user_activity_logs
SET ip_address = SPLIT_PART(ip_address, ',', 1)
WHERE ip_address IS NOT NULL 
  AND ip_address LIKE '%,%';

-- Trim any whitespace from IP addresses in profiles
UPDATE profiles
SET ip_address = TRIM(ip_address)
WHERE ip_address IS NOT NULL;

-- Trim any whitespace from IP addresses in user_activity_logs
UPDATE user_activity_logs
SET ip_address = TRIM(ip_address)
WHERE ip_address IS NOT NULL;