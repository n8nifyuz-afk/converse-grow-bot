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
        console.log('[MESSAGE-LIMIT] Fetching message count...', { 
          user: user?.id, 
          sessionId,
          hasSubscription 
        });

        if (user) {
          // Authenticated user - get persistent usage count
          const { data: usage, error } = await supabase
            .from('user_message_usage')
            .select('message_count')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('[MESSAGE-LIMIT] Error fetching user message usage:', error);
          } else {
            const count = usage?.message_count || 0;
            console.log('[MESSAGE-LIMIT] User message count:', count);
            setMessageCount(count);
          }
        } else if (sessionId) {
          // Anonymous user - get from usage table
          const { data: usage, error } = await supabase
            .from('user_message_usage')
            .select('message_count')
            .eq('session_id', sessionId)
            .maybeSingle();

          if (error) {
            console.error('[MESSAGE-LIMIT] Error fetching anonymous message usage:', error);
          } else {
            const count = usage?.message_count || 0;
            console.log('[MESSAGE-LIMIT] Anonymous message count:', count);
            setMessageCount(count);
          }
        }
      } catch (error) {
        console.error('[MESSAGE-LIMIT] Error in fetchMessageCount:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCount();
  }, [user, sessionId, hasSubscription]);

  const canSendMessage = () => {
    if (hasSubscription) {
      console.log('[MESSAGE-LIMIT] Has subscription - can send');
      return true;
    }
    const can = messageCount < FREE_MESSAGE_LIMIT;
    console.log('[MESSAGE-LIMIT] Can send message:', can, `(${messageCount}/${FREE_MESSAGE_LIMIT})`);
    return can;
  };

  const incrementMessageCount = async () => {
    console.log('[MESSAGE-LIMIT] Incrementing message count:', messageCount, '->', messageCount + 1);
    
    try {
      // Call the database function to increment
      const { data, error } = await supabase.rpc('increment_user_message_count', {
        p_user_id: user?.id || null,
        p_session_id: !user ? sessionId : null
      });

      if (error) {
        console.error('[MESSAGE-LIMIT] Error incrementing count:', error);
        // Still update local state as fallback
        setMessageCount(prev => prev + 1);
      } else {
        console.log('[MESSAGE-LIMIT] Server returned count:', data);
        setMessageCount(data || messageCount + 1);
      }
    } catch (error) {
      console.error('[MESSAGE-LIMIT] Exception incrementing count:', error);
      // Fallback to local increment
      setMessageCount(prev => prev + 1);
    }
  };

  const isAtLimit = () => {
    if (hasSubscription) {
      console.log('[MESSAGE-LIMIT] Has subscription - not at limit');
      return false;
    }
    const atLimit = messageCount >= FREE_MESSAGE_LIMIT;
    console.log('[MESSAGE-LIMIT] At limit check:', atLimit, `(${messageCount}/${FREE_MESSAGE_LIMIT})`);
    return atLimit;
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