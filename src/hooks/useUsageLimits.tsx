import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UsageLimits {
  canGenerate: boolean;
  remaining: number;
  limit: number;
  resetDate: string | null;
}

export function useUsageLimits() {
  const { user, subscriptionStatus } = useAuth();
  const [usageLimits, setUsageLimits] = useState<UsageLimits>({
    canGenerate: false,
    remaining: 0,
    limit: 0,
    resetDate: null
  });
  const [loading, setLoading] = useState(true);

  const checkLimits = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Call the database function to check and reset limits
      const { data, error } = await supabase.rpc('check_and_reset_usage_limits', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking usage limits:', error);
        return;
      }

      if (data && data.length > 0) {
        const limits = data[0];
        setUsageLimits({
          canGenerate: limits.can_generate,
          remaining: limits.remaining,
          limit: limits.limit_value,
          resetDate: limits.reset_date
        });
      }
    } catch (error) {
      console.error('Error in checkLimits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('increment_image_generation', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Refresh limits after incrementing
      await checkLimits();
      return data === true;
    } catch (error) {
      console.error('Error in incrementUsage:', error);
      return false;
    }
  };

  useEffect(() => {
    checkLimits();
  }, [user?.id, subscriptionStatus.subscribed]);

  // Listen for custom event to refresh limits after image generation
  useEffect(() => {
    const handleRefreshLimits = () => {
      console.log('Refreshing usage limits after image generation');
      checkLimits();
    };

    window.addEventListener('refresh-usage-limits', handleRefreshLimits);
    
    return () => {
      window.removeEventListener('refresh-usage-limits', handleRefreshLimits);
    };
  }, [checkLimits]);

  return {
    usageLimits,
    loading,
    checkLimits,
    incrementUsage
  };
}
