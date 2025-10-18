-- Create a function to clean up expired usage periods automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_usage_periods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired usage periods
  DELETE FROM usage_limits 
  WHERE period_end < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % expired usage period records', v_deleted_count;
END;
$$;