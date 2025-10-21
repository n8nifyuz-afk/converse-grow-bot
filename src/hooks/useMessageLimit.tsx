import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Generate browser-based session ID
const generateSessionId = () => {
  const stored = localStorage.getItem('anonymous_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('anonymous_session_id', newId);
  return newId;
};

export const useMessageLimit = () => {
  const { user, subscriptionStatus } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const sessionId = !user ? generateSessionId() : null;
  
  // Free tier limits - 3 messages for free users
  const FREE_MESSAGE_LIMIT = 3;
  
  // Check if user has subscription - use subscriptionStatus from AuthContext
  const hasSubscription = user && subscriptionStatus.subscribed;

  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        if (user) {
          // Authenticated user - get persistent usage count
          const { data: usage, error } = await supabase
            .from('user_message_usage')
            .select('message_count')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error) {
            const count = usage?.message_count || 0;
            setMessageCount(count);
          }
        } else if (sessionId) {
          // Anonymous user - get from usage table
          const { data: usage, error } = await supabase
            .from('user_message_usage')
            .select('message_count')
            .eq('session_id', sessionId)
            .maybeSingle();

          if (!error) {
            const count = usage?.message_count || 0;
            setMessageCount(count);
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCount();
  }, [user, sessionId, hasSubscription]);

  const canSendMessage = () => {
    if (hasSubscription) {
      return true;
    }
    return messageCount < FREE_MESSAGE_LIMIT;
  };

  const incrementMessageCount = async () => {
    try {
      // Call the database function to increment
      const { data, error } = await supabase.rpc('increment_user_message_count', {
        p_user_id: user?.id || null,
        p_session_id: !user ? sessionId : null
      });

      if (error) {
        // Still update local state as fallback
        setMessageCount(prev => prev + 1);
      } else {
        setMessageCount(data || messageCount + 1);
      }
    } catch (error) {
      // Fallback to local increment
      setMessageCount(prev => prev + 1);
    }
  };

  const isAtLimit = () => {
    if (hasSubscription) {
      return false;
    }
    return messageCount >= FREE_MESSAGE_LIMIT;
  };

  return {
    messageCount,
    canSendMessage: canSendMessage(),
    isAtLimit: isAtLimit(),
    hasSubscription,
    incrementMessageCount,
    loading,
    sessionId,
    limit: FREE_MESSAGE_LIMIT
  };
};