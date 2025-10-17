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
          // Authenticated user - count ALL user messages across ALL chats
          // First get all chat IDs for this user
          const { data: userChats, error: chatsError } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', user.id);

          if (chatsError) {
            console.error('[MESSAGE-LIMIT] Error fetching user chats:', chatsError);
            setLoading(false);
            return;
          }

          const chatIds = userChats?.map(chat => chat.id) || [];
          
          if (chatIds.length === 0) {
            console.log('[MESSAGE-LIMIT] No chats found for user');
            setMessageCount(0);
            setLoading(false);
            return;
          }

          // Count all user messages in those chats
          const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'user')
            .in('chat_id', chatIds);

          if (error) {
            console.error('[MESSAGE-LIMIT] Error fetching user message count:', error);
          } else {
            console.log('[MESSAGE-LIMIT] User message count:', count);
            setMessageCount(count || 0);
          }
        } else if (sessionId) {
          // Anonymous user - get from anonymous_messages table
          const { count, error } = await supabase
            .from('anonymous_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('role', 'user');

          if (error) {
            console.error('[MESSAGE-LIMIT] Error fetching anonymous message count:', error);
          } else {
            console.log('[MESSAGE-LIMIT] Anonymous message count:', count);
            setMessageCount(count || 0);
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

  const incrementMessageCount = () => {
    console.log('[MESSAGE-LIMIT] Incrementing message count:', messageCount, '->', messageCount + 1);
    setMessageCount(prev => prev + 1);
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