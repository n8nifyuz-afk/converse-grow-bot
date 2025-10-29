-- Add GCLID and URL parameters tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS url_params JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS initial_referer TEXT;

-- Add index for GCLID lookups (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_gclid ON public.profiles(gclid) WHERE gclid IS NOT NULL;

COMMENT ON COLUMN public.profiles.gclid IS 'Google Click ID for tracking ad conversions';
COMMENT ON COLUMN public.profiles.url_params IS 'All URL parameters captured during signup (UTM params, etc.)';
COMMENT ON COLUMN public.profiles.initial_referer IS 'Referer URL when user first signed up';