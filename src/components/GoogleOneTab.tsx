import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/utils/errorLogger';

interface GoogleOneTabProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleOneTab({ onSuccess }: GoogleOneTabProps) {
  const { user, signInWithGoogle, loading } = useAuth();
  const oneTabRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Don't show One Tap if user is already authenticated or auth is still loading
    if (user || loading || isInitialized.current) return;

    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleOneTap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if (window.google && window.google.accounts) {
          initializeGoogleOneTap();
        }
      };
      document.head.appendChild(script);
    };

    const initializeGoogleOneTap = async () => {
      if (isInitialized.current) return;
      
      try {
        // Use environment variable for client ID (stored in Supabase secrets)
        const clientId = "217944304340-s9hdphrnpakgegrk3e64pujvu0g7rp99.apps.googleusercontent.com";

        // CRITICAL: Do NOT provide nonce - let Google generate token without nonce field
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true, // Allow user to dismiss if they want
          context: 'signin',
          ux_mode: 'popup',
          // No nonce parameter - this prevents Google from adding nonce to token
        });

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            logInfo('Google One Tap not displayed');
          }
        });

        isInitialized.current = true;
      } catch (error) {
        logError('Failed to initialize Google One Tap');
      }
    };

    const handleCredentialResponse = async (response: any) => {
      try {
        console.log('[GOOGLE-ONETAP] 🔵 Starting authentication...');
        console.log('[GOOGLE-ONETAP] 📍 Current URL:', window.location.href);
        logInfo('Google One Tap: Starting authentication...');
        
        // CRITICAL: Don't decode or extract nonce - just pass the raw token
        // Supabase will validate the Google ID token directly without nonce checking
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          // CRITICAL: Do NOT include nonce parameter at all
        });

        if (error) {
          console.error('[GOOGLE-ONETAP] ❌ Authentication failed:', error);
          logError('Google One Tap authentication failed');
          
          // Fallback: Try regular OAuth as backup
          console.log('[GOOGLE-ONETAP] 🔄 Trying OAuth fallback...');
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            }
          });
          
          if (oauthError) {
            console.error('[GOOGLE-ONETAP] ❌ OAuth fallback failed:', oauthError);
            logError('OAuth authentication failed');
          }
        } else if (data?.session) {
          console.log('[GOOGLE-ONETAP] ✅ Session created:', data.session.user.email);
          console.log('[GOOGLE-ONETAP] 📍 URL after session creation:', window.location.href);
          logInfo('Google One Tap: Session created successfully');
          
          // CRITICAL: Wait for session to be fully established
          // This prevents the "too fast" redirect issue when user has only 1 Google account
          console.log('[GOOGLE-ONETAP] ⏳ Waiting 500ms for session to stabilize...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify session is actually set in Supabase
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log('[GOOGLE-ONETAP] ✅ Session verified successfully');
            console.log('[GOOGLE-ONETAP] 📍 Final URL:', window.location.href);
            logInfo('Google One Tap: Session verified, authentication complete');
            onSuccess?.();
          } else {
            console.error('[GOOGLE-ONETAP] ❌ Session not found after creation');
            logError('Google One Tap: Session not found after creation');
          }
        } else {
          console.warn('[GOOGLE-ONETAP] ⚠️ No session and no error - unexpected state');
        }
      } catch (error) {
        console.error('[GOOGLE-ONETAP] ❌ Unexpected error:', error);
        logError('Authentication error occurred');
      }
    };

    // Load Google script
    loadGoogleScript();

    // Cleanup function
    return () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Silently handle cleanup errors
        }
      }
    };
  }, [user, loading, signInWithGoogle, onSuccess]);

  // Don't render anything if user is authenticated or auth is loading
  if (user || loading) return null;

  return (
    <div 
      ref={oneTabRef} 
      id="google-one-tap" 
      className="fixed top-0 left-0 right-0 z-50"
    />
  );
}