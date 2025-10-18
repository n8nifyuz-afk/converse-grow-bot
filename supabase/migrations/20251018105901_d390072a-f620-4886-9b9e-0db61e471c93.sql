-- Fix the increment_image_generation function to properly check limits BEFORE incrementing
DROP FUNCTION IF EXISTS public.increment_image_generation(uuid);

CREATE OR REPLACE FUNCTION public.increment_image_generation(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_generate BOOLEAN;
  v_limit INTEGER;
  v_used INTEGER;
  v_updated INTEGER;
BEGIN
  -- First check if user can generate (this also resets expired periods)
  SELECT can_generate, limit_value 
  INTO v_can_generate, v_limit
  FROM check_and_reset_usage_limits(p_user_id);
  
  -- CRITICAL: If user cannot generate (free user or at limit), return false immediately
  IF NOT v_can_generate THEN
    RAISE NOTICE 'User % cannot generate images (can_generate=false, limit=%)', p_user_id, v_limit;
    RETURN false;
  END IF;
  
  -- Only increment if user has capacity
  UPDATE usage_limits
  SET 
    image_generations_used = image_generations_used + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  AND period_end > now()
  AND image_generations_used < image_generations_limit; -- Double check limit
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated = 0 THEN
    RAISE NOTICE 'Failed to increment for user % (no rows updated)', p_user_id;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;