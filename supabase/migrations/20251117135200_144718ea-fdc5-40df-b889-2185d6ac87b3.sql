-- Add Google Analytics client_id and Google Ads identifiers to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gbraid VARCHAR(255),
ADD COLUMN IF NOT EXISTS wbraid VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gclid ON public.profiles(gclid);
CREATE INDEX IF NOT EXISTS idx_profiles_gbraid ON public.profiles(gbraid);
CREATE INDEX IF NOT EXISTS idx_profiles_wbraid ON public.profiles(wbraid);

-- Add comment to document the purpose
COMMENT ON COLUMN public.profiles.client_id IS 'GA4 client_id for server-side event tracking';
COMMENT ON COLUMN public.profiles.gbraid IS 'Google Ads iOS web-to-app identifier';
COMMENT ON COLUMN public.profiles.wbraid IS 'Google Ads app-to-web identifier';