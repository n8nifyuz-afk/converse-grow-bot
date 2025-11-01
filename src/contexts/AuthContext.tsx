import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { trackPaymentComplete, trackRegistrationComplete } from '@/utils/gtmTracking';
import { fetchIPAndCountry } from '@/utils/webhookMetadata';
import { logUserActivity, getFullTrackingData } from '@/utils/browserTracking';
import { cleanIpAddress } from '@/utils/ipFormatter';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loadingSubscription: boolean;
  userProfile: any;
  subscriptionStatus: {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
    plan: string | null;
    plan_name: string | null;
  };
  showPricingModal: boolean;
  setShowPricingModal: (show: boolean) => void;
  checkSubscription: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signInWithMicrosoft: () => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  // Account linking methods
  linkPhoneNumber: (phone: string) => Promise<{ error: any }>;
  verifyPhoneLink: (phone: string, token: string) => Promise<{ error: any }>;
  linkEmailPassword: (email: string, password: string) => Promise<{ error: any }>;
  linkGoogleAccount: () => Promise<{ error: any }>;
  linkAppleAccount: () => Promise<{ error: any }>;
  linkMicrosoftAccount: () => Promise<{ error: any }>;
  unlinkAuthMethod: (provider: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SessionStorage key for caching subscription status
const SUBSCRIPTION_CACHE_KEY = 'chatl_subscription_status';

// Helper functions for sessionStorage management
const loadCachedSubscription = () => {
  try {
    const cached = sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    // Silent error handling
  }
  return null;
};

const saveCachedSubscription = (status: any) => {
  try {
    sessionStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(status));
  } catch (error) {
    // Silent error handling
  }
};

const clearCachedSubscription = () => {
  try {
    sessionStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
  } catch (error) {
    // Silent error handling
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  // Try to load cached subscription status on mount
  const cachedStatus = loadCachedSubscription();
  const [subscriptionStatus, setSubscriptionStatus] = useState(cachedStatus || {
    subscribed: false,
    product_id: null,
    subscription_end: null,
    plan: null,
    plan_name: null
  });
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Update user profile with geo data on login (NO activity logging here - done in onAuthStateChange)
  const updateLoginGeoData = async (userId: string) => {
    try {
      const { ip, country } = await fetchIPAndCountry();
      const trackingData = getFullTrackingData('login');
      
      // REMOVED: Activity logging is now done only once in onAuthStateChange
      
      // Update profile with IP and country
      if (ip || country) {
        await supabase
          .from('profiles')
          .update({
            ip_address: ip,
            country: country,
            browser_info: JSON.parse(JSON.stringify(trackingData.browserInfo)),
            device_info: JSON.parse(JSON.stringify(trackingData.deviceInfo)),
            timezone: trackingData.deviceInfo.timezone,
            locale: trackingData.deviceInfo.language,
            last_login_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      // Login geo data update failed silently
    }
  };

  // Sync OAuth profile data (Google, Apple, Microsoft) on sign-in
  const syncOAuthProfile = async (session: Session) => {
    try {
      const user = session.user;
      const metadata = user.user_metadata;
      const appMetadata = user.app_metadata;
      
      // Detect provider
      const isGoogleSignIn = 
        metadata?.iss === 'https://accounts.google.com' ||
        appMetadata?.provider === 'google';
      
      const isAppleSignIn = 
        metadata?.iss === 'https://appleid.apple.com' ||
        appMetadata?.provider === 'apple';
      
      const isMicrosoftSignIn = 
        appMetadata?.provider === 'azure' ||
        appMetadata?.provider === 'microsoft';
      
      const provider = isGoogleSignIn ? 'google' : isAppleSignIn ? 'apple' : isMicrosoftSignIn ? 'microsoft' : 'email';
      
      // REMOVED: updateLoginGeoData call - profile is already updated by log-user-activity edge function
      
      // Only sync profile data for OAuth providers
      if (!isGoogleSignIn && !isAppleSignIn && !isMicrosoftSignIn) return;
      
      // Get current profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      
      // Extract comprehensive OAuth data - STORE EVERYTHING
      const updateData: any = {
        updated_at: new Date().toISOString(),
        oauth_provider: provider,
        oauth_metadata: metadata // Store COMPLETE OAuth metadata for admin analysis
      };
      
      // Extract display name (works for all providers)
      const latestName = metadata?.full_name || metadata?.name || metadata?.display_name || metadata?.given_name || currentProfile?.display_name;
      if (latestName && currentProfile?.display_name !== latestName) {
        updateData.display_name = latestName;
      }
      
      // Extract avatar (works for all providers)
      const latestAvatar = metadata?.avatar_url || metadata?.picture || metadata?.photo;
      if (latestAvatar && currentProfile?.avatar_url !== latestAvatar) {
        updateData.avatar_url = latestAvatar;
      }
      
      // Extract email (update if changed)
      if (metadata?.email && currentProfile?.email !== metadata.email) {
        updateData.email = metadata.email;
      }
      
      // Extract timezone (with browser fallback)
      const timezone = metadata?.iana_timezone || metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone && currentProfile?.timezone !== timezone) {
        updateData.timezone = timezone;
      }
      
      // Extract locale (with browser fallback)
      const locale = metadata?.locale || metadata?.preferredLanguage || navigator.language;
      if (locale && currentProfile?.locale !== locale) {
        updateData.locale = locale;
      }
      
      // Google-specific extended data
      if (isGoogleSignIn) {
        if (metadata?.locale) {
          updateData.locale = metadata.locale;
        }
      }
      
      // Microsoft-specific extended data
      if (isMicrosoftSignIn) {
        
        // Store ALL Microsoft Graph fields
        const msFields = {
          ...metadata,
          jobTitle: metadata?.jobTitle,
          officeLocation: metadata?.officeLocation,
          department: metadata?.department,
          companyName: metadata?.companyName,
          mobilePhone: metadata?.mobilePhone,
          businessPhones: metadata?.businessPhones,
          city: metadata?.city,
          country: metadata?.country,
          postalCode: metadata?.postalCode,
          state: metadata?.state,
          streetAddress: metadata?.streetAddress,
        };
        
        updateData.oauth_metadata = msFields;
        
        // Phone from Microsoft
        if (metadata?.mobilePhone || metadata?.businessPhones?.[0]) {
          updateData.phone_number = metadata.mobilePhone || metadata.businessPhones?.[0];
        }
        
        // Preferred language
        if (metadata?.preferredLanguage || metadata?.locale) {
          updateData.locale = metadata.preferredLanguage || metadata.locale;
        }
      }
      
      // Apple-specific data (limited due to Apple privacy)
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 2 && currentProfile) { // More than just updated_at + oauth_provider
        await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id);
      }
    } catch (error) {
      // OAuth profile sync failed
    }
  };

  // Fetch user profile - only read, no updates to prevent 429 errors
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        setUserProfile(existingProfile);
      }
    } catch (error) {
      // Silently fail
    }
  };

  // Refresh user profile - public method for manual refresh after updates
  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    let initialCheckComplete = false;
    
    // Check for OAuth errors in URL parameters (e.g., after failed account linking)
    const checkOAuthErrors = () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const error = params.get('error') || hashParams.get('error');
      const errorDescription = params.get('error_description') || hashParams.get('error_description');
      const errorCode = params.get('error_code') || hashParams.get('error_code');
      
      if (error || errorDescription) {
        // Import toast dynamically to avoid issues
        import('@/hooks/use-toast').then(({ toast }) => {
          let title = 'Account Linking Failed';
          let description = errorDescription || 'Failed to link account';
          
          // Handle specific error cases
          if (errorDescription?.toLowerCase().includes('already linked') || 
              errorDescription?.toLowerCase().includes('identity is already linked')) {
            title = 'Account Already Used';
            description = 'This Google/Apple account is already linked to a different user. Please use another account or sign in with the existing one.';
          } else if (error === 'identity_already_exists' || errorCode === '23505') {
            title = 'Already Linked';
            description = 'You have already linked this type of account to your profile.';
          } else if (errorCode === '422' || error === '422') {
            title = 'Cannot Link Account';
            description = 'This account cannot be linked. It may already be in use by another user.';
          }
          
          toast({
            title,
            description,
            variant: 'destructive',
            duration: 7000,
          });
        });
        
        // Clean up URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    };
    
    // Check for errors immediately on mount
    checkOAuthErrors();
    
    // Set up auth state listener - FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // CRITICAL: Only synchronous state updates here to prevent auth loops
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          
          // CRITICAL: Set loading to false immediately for OAuth redirects to prevent blank screen
          setLoading(false);
          
          // Clean URL - remove hash fragments from OAuth redirects AFTER session is established
          if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
          // Defer async operations to prevent blocking auth flow
          setTimeout(async () => {
            // Check if this was an OAuth login (not a page refresh)
            const wasOAuthLogin = sessionStorage.getItem('oauth_login_initiated') === 'true';
            
            if (wasOAuthLogin) {
              // Clear the flag
              sessionStorage.removeItem('oauth_login_initiated');
              
              // Log the OAuth login
              await logUserActivity(session.user.id, 'login');
            }
            
            // Check if this is a new signup and track registration
            // The trackRegistrationComplete function has its own deduplication via localStorage
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, created_at')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              const profileCreated = new Date(session.user.created_at).getTime();
              const now = Date.now();
              // Profile created within last 60 seconds = new signup
              const isNewSignup = (now - profileCreated) < 60000;
              
              // Always attempt to track registration (deduplication handled in function)
              trackRegistrationComplete();
              
              // Send webhook only for new signups
              if (isNewSignup) {
                // CRITICAL: Check if webhook already sent to prevent duplicates during OAuth flow
                const webhookSentKey = `webhook_sent_${session.user.id}`;
                const webhookAlreadySent = sessionStorage.getItem(webhookSentKey);
                
                if (webhookAlreadySent) {
                  console.log('[SIGNUP-WEBHOOK] Webhook already sent for this signup, skipping duplicate');
                } else {
                  // Send subscriber webhook for new user with IP/country from client
                  try {
                  // Get IPv4 address and country using ipapi.co (returns IPv4 only)
                  let ipAddress = 'Unknown';
                  let country = 'Unknown';
                  
                  try {
                    // Use ipapi.co to get IP and country
                    const ipResponse = await fetch('https://ipapi.co/json/');
                    if (ipResponse.ok) {
                      const ipData = await ipResponse.json();
                      const rawIp = ipData.ip || 'Unknown';
                      // Clean and format the IP address properly
                      ipAddress = cleanIpAddress(rawIp);
                      country = ipData.country_code || ipData.country || 'Unknown';
                      console.log('[SIGNUP-WEBHOOK] Got IP address:', ipAddress, 'Country:', country);
                    } else {
                      // Fallback to ip-api.com
                      const fallbackResponse = await fetch('https://api.ipify.org?format=json');
                      if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        const rawIp = fallbackData.ip || 'Unknown';
                        // Clean and format the IP address properly
                        ipAddress = cleanIpAddress(rawIp);
                        // Get country separately
                        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/country/`);
                        if (geoResponse.ok) {
                          country = await geoResponse.text();
                        }
                      }
                    }
                  } catch (traceError) {
                    console.warn('Failed to get IP address:', traceError);
                  }
                  
                  // Capture URL parameters (GCLID, UTM params, etc.)
                  const urlParams = new URLSearchParams(window.location.search);
                  const gclid = urlParams.get('gclid') || localStorage.getItem('gclid') || null;
                  
                  // Get URL params from current URL or localStorage (for OAuth redirects)
                  let urlParamsObj: Record<string, string> = {};
                  urlParams.forEach((value, key) => {
                    urlParamsObj[key] = value;
                  });
                  
                  // If no URL params in current URL, try to get from localStorage (OAuth case)
                  if (Object.keys(urlParamsObj).length === 0) {
                    const storedParams = localStorage.getItem('url_params');
                    if (storedParams) {
                      try {
                        urlParamsObj = JSON.parse(storedParams);
                        console.log('[SIGNUP] Restored URL params from localStorage:', urlParamsObj);
                      } catch (e) {
                        console.warn('[SIGNUP] Failed to parse stored URL params');
                      }
                    }
                  }
                  
                  // Extract and log Google Ads parameters specifically
                  const googleAdsParams = {
                    gclid: urlParamsObj.gclid || gclid,
                    gad_source: urlParamsObj.gad_source,
                    gad_campaignid: urlParamsObj.gad_campaignid,
                    gbraid: urlParamsObj.gbraid,
                    utm_source: urlParamsObj.utm_source,
                    utm_medium: urlParamsObj.utm_medium,
                    utm_campaign: urlParamsObj.utm_campaign
                  };
                  
                  console.log('🎯 [SIGNUP-GOOGLE-ADS] Google Ads Parameters Captured:', googleAdsParams);
                  console.log('📊 [SIGNUP-ALL-PARAMS] All URL Parameters:', urlParamsObj);
                  
                  // Store GCLID in localStorage for future use (Google Click ID should persist)
                  if (gclid && !localStorage.getItem('gclid')) {
                    localStorage.setItem('gclid', gclid);
                  }
                  
                  // Save GCLID and URL params to database
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                      gclid: gclid,
                      url_params: urlParamsObj,
                      initial_referer: document.referrer || null
                    })
                    .eq('user_id', session.user.id);
                  
                  if (updateError) {
                    console.error('❌ [SIGNUP-DB] Failed to save params to database:', updateError);
                  } else {
                    console.log('✅ [SIGNUP-DB] Successfully saved to database:', {
                      gclid,
                      gad_source: urlParamsObj.gad_source,
                      gad_campaignid: urlParamsObj.gad_campaignid,
                      gbraid: urlParamsObj.gbraid,
                      all_params: urlParamsObj
                    });
                  }
                  
                  // Fetch profile data including phone_number and display_name
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('signup_method, phone_number, display_name')
                    .eq('user_id', session.user.id)
                    .single();

                  // For phone signups: use phone_number when email is null
                  const emailOrPhone = session.user.email || profileData?.phone_number || '';
                  // For username: use display_name from profile
                  const username = profileData?.display_name || 
                                   session.user.user_metadata?.name || 
                                   session.user.user_metadata?.display_name || 
                                   session.user.email?.split('@')[0] || 
                                   'User';

                  console.log('📤 [SIGNUP-WEBHOOK] Sending webhook with Google Ads data:', {
                    gclid: gclid,
                    gad_source: urlParamsObj.gad_source,
                    gad_campaignid: urlParamsObj.gad_campaignid,
                    gbraid: urlParamsObj.gbraid
                  });
                  
                  // Mark webhook as sent BEFORE invoking to prevent race condition duplicates
                  sessionStorage.setItem(webhookSentKey, 'true');
                  
                  await supabase.functions.invoke('send-subscriber-webhook', {
                    body: {
                      userId: session.user.id,
                      email: emailOrPhone,
                      username: username,
                      ipAddress,
                      country,
                      signupMethod: profileData?.signup_method || 'email',
                      gclid: gclid,
                      urlParams: urlParamsObj,
                      referer: document.referrer || null,
                    }
                  });
                  
                  console.log('[SIGNUP-WEBHOOK] Successfully sent and marked as complete');
                  } catch (webhookError) {
                    console.error('Failed to send subscriber webhook:', webhookError);
                  }
                } // End webhookAlreadySent check
              } // End if (isNewSignup)
              
              // IMPORTANT: Always try to capture GCLID for ALL logins (not just new signups)
              // This handles cases where user signs up without params, then returns with ?gclid=ABC
              try {
                const { data: existingProfile } = await supabase
                  .from('profiles')
                  .select('gclid, url_params, initial_referer')
                  .eq('user_id', session.user.id)
                  .single();
                
                // Capture current URL params and GCLID from URL or localStorage
                const currentUrlParams = new URLSearchParams(window.location.search);
                const currentGclid = currentUrlParams.get('gclid') || localStorage.getItem('gclid') || null;
                
                // Update if we have a NEW gclid OR if profile has no gclid yet
                const shouldUpdate = (currentGclid && !existingProfile?.gclid) || 
                                    (currentGclid && currentGclid !== existingProfile?.gclid);
                
                if (shouldUpdate && currentGclid) {
                  let urlParamsObj: Record<string, string> = {};
                  currentUrlParams.forEach((value, key) => {
                    urlParamsObj[key] = value;
                  });
                  
                  // If no URL params in current URL, try to get from localStorage (OAuth case)
                  if (Object.keys(urlParamsObj).length === 0) {
                    const storedParams = localStorage.getItem('url_params');
                    if (storedParams) {
                      try {
                        urlParamsObj = JSON.parse(storedParams);
                      } catch (e) {
                        // Silent error
                      }
                    }
                  }
                  
                  // Store in localStorage for persistence
                  if (!localStorage.getItem('gclid')) {
                    localStorage.setItem('gclid', currentGclid);
                  }
                  
                  await supabase
                    .from('profiles')
                    .update({
                      gclid: currentGclid,
                      url_params: Object.keys(urlParamsObj).length > 0 ? urlParamsObj : existingProfile?.url_params,
                      initial_referer: document.referrer || existingProfile?.initial_referer || null
                    })
                    .eq('user_id', session.user.id);
                  
                  console.log('[LOGIN] Updated GCLID for user:', currentGclid);
                }
              } catch (err) {
                console.warn('Failed to update user GCLID on login:', err);
              }
            }
            
            syncOAuthProfile(session);
            checkSubscription();
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          
          // Clear subscription status and cache
          setSubscriptionStatus({
            subscribed: false,
            product_id: null,
            subscription_end: null,
            plan: null,
            plan_name: null
          });
          clearCachedSubscription();
          
          // Clear pricing modal auth flag on sign-out so it can show again on next sign-in
          sessionStorage.removeItem('pricing_modal_shown_auth');
        }
        
        // Set loading to false for other auth state changes if initial check is complete
        if (initialCheckComplete && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      // Mark initial check as complete and set loading to false
      initialCheckComplete = true;
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for subscription checks when user changes
  useEffect(() => {
    let realtimeChannel: any = null;
    
    if (user) {
      // Load cached status immediately if available
      const cached = loadCachedSubscription();
      if (cached) {
        setSubscriptionStatus(cached);
        // Don't set loadingSubscription to false here - wait for actual Stripe check
      }
      
      // Then check subscription via Stripe API (verify cache)
      // This will set loadingSubscription to false when complete
      checkSubscription();
      
      // Set up realtime listener for webhook updates - this is the primary update mechanism
      realtimeChannel = supabase
        .channel(`user-subscription-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Refresh from Stripe when webhook updates database
            setTimeout(() => checkSubscription(), 1000);
          }
        )
        .subscribe();
      
      // Check for returning from Stripe (ONLY success case with session_id)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      // CRITICAL FIX: Only run retry logic if there's a session_id (actual payment completed)
      // Don't use document.referrer alone - user might have just clicked back button without paying
      const isReturningFromStripe = !!sessionId;
      
      // Also detect if user came from Stripe via referrer
      const comingFromStripe = document.referrer.includes('stripe.com') || document.referrer.includes('checkout.stripe.com');
      
      // If user came from Stripe but has NO session_id, they cancelled/went back
      if (comingFromStripe && !sessionId) {
        console.log('[SUBSCRIPTION] User returned from Stripe without payment - clearing cached subscription');
        // Clear any stale cached subscription data
        const resetStatus = {
          subscribed: false,
          product_id: null,
          subscription_end: null,
          plan: null,
          plan_name: null
        };
        setSubscriptionStatus(resetStatus);
        clearCachedSubscription();
        setLoadingSubscription(false);
        return; // Don't run retry logic
      }
      
      if (isReturningFromStripe) {
        // Clean URL immediately to avoid confusion
        const cleanUrl = () => {
          if (sessionId || urlParams.has('success')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };
        
        // Function to check subscription with retries after Stripe checkout
        const checkWithRetries = async (attempt = 1, maxAttempts = 4) => {
          const delay = attempt === 1 ? 3000 : 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            // Check Stripe directly - this will update subscription status
            await checkSubscription();
            
            if (subscriptionStatus.subscribed) {
              cleanUrl();
            } else if (attempt < maxAttempts) {
              checkWithRetries(attempt + 1, maxAttempts);
            } else {
              cleanUrl();
              // Force one final refresh to ensure UI is up to date
              await checkSubscription();
            }
          } catch (error) {
            if (attempt < maxAttempts) {
              checkWithRetries(attempt + 1, maxAttempts);
            } else {
              cleanUrl();
            }
          }
        };
        
        // Clean URL after a short delay regardless of subscription check result
        setTimeout(cleanUrl, 5000);
        
        checkWithRetries();
      }
    } else {
      // User signed out
      setLoadingSubscription(false);
    }

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Page Visibility API: Refresh subscription when user returns to tab
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Debounce to prevent multiple rapid checks
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        
        debounceTimeout = setTimeout(() => {
          checkSubscription();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [user]);

  // Separate effect to handle profile fetching when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
    }
  }, [user?.id]); // Only run when user ID changes

  const signUp = async (email: string, password: string, displayName?: string) => {
    // First check if user exists with OAuth provider
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('signup_method')
        .eq('email', email)
        .maybeSingle();
      
      if (profile?.signup_method === 'google' || profile?.signup_method === 'apple') {
        // Use production domain to avoid security warnings
        const redirectUrl = 'https://www.chatl.ai/reset-password';
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });
        
        if (resetError) {
          return {
            error: {
              message: `This email is already registered via ${profile.signup_method === 'google' ? 'Google' : 'Apple'}. Please use "Continue with ${profile.signup_method === 'google' ? 'Google' : 'Apple'}" to sign in.`,
              code: 'oauth_account_exists'
            }
          };
        }
        
        return {
          error: {
            message: `This account exists with ${profile.signup_method === 'google' ? 'Google' : 'Apple'}. We've sent you an email to add a password so you can sign in with email too.`,
            code: 'password_setup_sent'
          }
        };
      }
    } catch (checkError) {
      // Continue with signup if check fails
    }
    
    // Get IP address and country using Cloudflare trace (supports CORS)
    let ipAddress: string | undefined;
    let country: string | undefined;
    
    try {
      const geoResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      if (geoResponse.ok) {
        const text = await geoResponse.text();
        const geoData = Object.fromEntries(
          text.trim().split('\n').map(line => line.split('='))
        );
        ipAddress = geoData.ip;
        country = geoData.loc;
      }
    } catch (geoError) {
      // Silently fail - continue signup without geo data
      console.error('Failed to fetch geo data:', geoError);
    }
    
    // Use production domain for email confirmation
    const redirectUrl = 'https://www.chatl.ai/';
    
    const signupData: any = {
      signup_method: 'email'
    };
    
    if (displayName) {
      signupData.display_name = displayName;
    }
    
    if (ipAddress) {
      signupData.ip_address = ipAddress;
    }
    
    if (country) {
      signupData.country = country;
    }
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: signupData
      }
    });
    
    // Check if user already exists and has confirmed their email
    if (data?.user && !data?.session && !error) {
      // If email is already confirmed OR user has no identities, they're an existing user
      if (data.user.email_confirmed_at || (data.user.identities && data.user.identities.length === 0)) {
        return { 
          error: { 
            message: 'User already registered',
            status: 400 
          } 
        };
      }
      
      // New user who needs to verify email
      return { error: null };
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Log activity only on successful actual sign-in
    if (!error && data?.user) {
      await logUserActivity(data.user.id, 'login');
    }
    
    // If login fails, check if user exists with OAuth provider
    if (error && error.message?.toLowerCase().includes('invalid')) {
      try {
        // Check profiles table to see signup method
        const { data: profile } = await supabase
          .from('profiles')
          .select('signup_method')
          .eq('email', email)
          .maybeSingle();
        
        if (profile?.signup_method === 'google' || profile?.signup_method === 'apple') {
          // Use production domain to avoid security warnings
          const redirectUrl = 'https://www.chatl.ai/reset-password';
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
          });
          
          if (resetError) {
            return { 
              error: { 
                message: `This email is registered via ${profile.signup_method === 'google' ? 'Google' : 'Apple'}. Please use "Continue with ${profile.signup_method === 'google' ? 'Google' : 'Apple'}" to sign in.`,
                code: 'oauth_only_account'
              } 
            };
          }
          
          return { 
            error: { 
              message: `This account was created with ${profile.signup_method === 'google' ? 'Google' : 'Apple'}. We've sent you an email to set up a password so you can sign in with email too.`,
              code: 'password_reset_sent'
            } 
          };
        }
      } catch (checkError) {
        console.error('❌ Error checking signup method:', checkError);
        // If check fails, return original error
      }
    }
    
    return { error };
  };


  const signInWithGoogle = async () => {
    // Use production domain
    const redirectUrl = 'https://www.chatl.ai/';
    
    // Mark that we're initiating OAuth login
    sessionStorage.setItem('oauth_login_initiated', 'true');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid',
        queryParams: {
          signup_method: 'google',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    return { error };
  };

  const signInWithApple = async () => {
    // Use production domain
    const redirectUrl = 'https://www.chatl.ai/';
    
    // Mark that we're initiating OAuth login
    sessionStorage.setItem('oauth_login_initiated', 'true');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          signup_method: 'apple'
        }
      }
    });
    
    return { error };
  };

  const signInWithMicrosoft = async () => {
    // Use production domain
    const redirectUrl = 'https://www.chatl.ai/';
    
    // Mark that we're initiating OAuth login
    sessionStorage.setItem('oauth_login_initiated', 'true');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid User.Read User.ReadBasic.All',
        queryParams: {
          signup_method: 'microsoft'
        }
      }
    });
    
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          signup_method: 'phone'
        }
      }
    });
    
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    // Log activity on successful phone verification
    if (!error && data?.user) {
      await logUserActivity(data.user.id, 'login');
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    // Use production domain for password reset
    const redirectUrl = 'https://www.chatl.ai/reset-password';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { error };
  };

  // Helper function to check and show pricing modal for free users
  const checkAndShowPricingModal = (status: { subscribed: boolean; product_id: string | null; subscription_end: string | null }) => {
    // Check if modal was already shown this authentication (cleared on sign-out)
    const modalShownKey = 'pricing_modal_shown_auth';
    const wasShown = sessionStorage.getItem(modalShownKey);
    
    // Only show if:
    // 1. Not already shown for this authentication session
    // 2. User is not subscribed (free user or no subscription)
    // 3. User exists (signed in)
    if (!wasShown && !status.subscribed && user) {
      setShowPricingModal(true);
      sessionStorage.setItem(modalShownKey, 'true');
    }
  };

  const checkSubscription = async () => {
    if (!user || isCheckingSubscription) {
      if (!user) {
        // Don't clear cache here - keep existing subscription status
        // Only reset the loading state
        setLoadingSubscription(false);
      }
      return;
    }

    setIsCheckingSubscription(true);
    setLoadingSubscription(true);
    try {
      // First, refresh the session to ensure we have a valid token
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
        if (sessionError || !sessionData.session) {
        // Fallback: Check database directly
        const { data: dbSub, error: dbError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (!dbError && dbSub && new Date(dbSub.current_period_end) > new Date()) {
          const newStatus = {
            subscribed: true,
            product_id: dbSub.product_id,
            subscription_end: dbSub.current_period_end,
            plan: dbSub.plan,
            plan_name: dbSub.plan_name
          };
          setSubscriptionStatus(newStatus);
          saveCachedSubscription(newStatus);
          checkAndShowPricingModal(newStatus);
        } else {
          const resetStatus = {
            subscribed: false,
            product_id: null,
            subscription_end: null,
            plan: null,
            plan_name: null
          };
          setSubscriptionStatus(resetStatus);
          clearCachedSubscription();
          checkAndShowPricingModal(resetStatus);
        }
          setIsCheckingSubscription(false);
          setLoadingSubscription(false);
          return;
        }
      }
      
      // Check with Stripe API - source of truth
      
      // Get the current session to ensure we have a valid token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        throw new Error('No valid authentication token');
      }
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });
      
      if (error) {
        console.error('❌ Error checking subscription with Stripe:', error);
        // NEVER trust database as source of truth - only Stripe API
        // If Stripe check fails, mark as unsubscribed for security
        console.warn('⚠️ Stripe check failed - marking as unsubscribed for security');
        const resetStatus = {
          subscribed: false,
          product_id: null,
          subscription_end: null,
          plan: null,
          plan_name: null
        };
        setSubscriptionStatus(resetStatus);
        clearCachedSubscription();
        checkAndShowPricingModal(resetStatus);
      } else if (data) {
        // If Stripe check passed, get full details from database
        const { data: dbSub } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        const previousSubscribed = subscriptionStatus.subscribed;
        const newStatus = {
          subscribed: data.subscribed || false,
          product_id: data.product_id || null,
          subscription_end: data.subscription_end || null,
          plan: dbSub?.plan || null,
          plan_name: dbSub?.plan_name || null
        };
        
        console.log('[SUBSCRIPTION-CHECK-RESULT]', {
          userId: user.id,
          email: user.email,
          newStatus,
          previousSubscribed,
          changed: previousSubscribed !== newStatus.subscribed
        });
        
        setSubscriptionStatus(newStatus);
        
        // Check if returning from Stripe checkout (session_id in URL)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const hasSessionId = !!sessionId;
        
        // Track ALL successful payments when returning from Stripe checkout
        // This includes: first subscription, upgrades, renewals, and trials
        const shouldTrack = hasSessionId && newStatus.subscribed;
        
        if (shouldTrack) {
          // Use session_id for deduplication (unique per payment)
          // This prevents double-tracking if page refreshes, but allows tracking renewals
          const trackedKey = `payment_tracked_${sessionId}`;
          const alreadyTracked = localStorage.getItem(trackedKey);
          
          if (!alreadyTracked && dbSub) {
            console.log('🎯 Tracking payment conversion to Google Analytics...');
            
            // Map plan to planType
            const planType = dbSub.plan === 'ultra_pro' ? 'Ultra' : 'Pro';
            
            // Map product_id to actual price and duration
            let planDuration: 'monthly' | '3_months' | 'yearly' = 'monthly';
            let planPrice = planType === 'Ultra' ? 39.99 : 19.99; // Default monthly prices
            
            // Determine duration and price from product_id or plan_name
            if (dbSub.product_id) {
              const productId = dbSub.product_id;
              const productIdLower = productId.toLowerCase();
              const planNameLower = (dbSub.plan_name || '').toLowerCase();
              
              // Check for duration indicators (including 3-day trial)
              if (productIdLower.includes('trial') || productIdLower.includes('3day') || planNameLower.includes('trial') || planNameLower.includes('3 day')) {
                planDuration = '3_months'; // Use 3_months for trial tracking
                planPrice = 0.99; // 3-day trial price
              } else if (productIdLower.includes('year') || productIdLower.includes('annual') || planNameLower.includes('year') || planNameLower.includes('annual')) {
                planDuration = 'yearly';
                planPrice = planType === 'Ultra' ? 119.99 : 59.99;
              } else if (productIdLower.includes('quarter') || productIdLower.includes('3month') || planNameLower.includes('3 month') || planNameLower.includes('quarter')) {
                planDuration = '3_months';
                planPrice = planType === 'Ultra' ? 99.99 : 49.99;
              }
              // Otherwise keep monthly defaults
            }
            
            console.log('📊 Tracking data:', { planType, planDuration, planPrice, product_id: dbSub.product_id, plan_name: dbSub.plan_name, session_id: sessionId });
            trackPaymentComplete(planType, planDuration, planPrice);
            
            // Mark this session as tracked
            localStorage.setItem(trackedKey, 'true');
            
            // Send payment webhook to n8n with IPv4 address
            (async () => {
              try {
                let ipAddress = 'Unknown';
                let country = 'Unknown';
                
                // Get IPv4 address using ipapi.co
                try {
                  const ipResponse = await fetch('https://ipapi.co/json/');
                  if (ipResponse.ok) {
                    const ipData = await ipResponse.json();
                    ipAddress = ipData.ip || 'Unknown';
                    country = ipData.country_code || ipData.country || 'Unknown';
                  }
                } catch (err) {
                  console.warn('Failed to get IP for payment webhook:', err);
                }
                
                // Capture URL parameters (GCLID, UTM params)
                // CRITICAL: Fetch stored params from database first (user may buy subscription days after signup)
                let gclid = null;
                let urlParamsObj: Record<string, string> = {};
                let referer = document.referrer || "null";
                
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('gclid, url_params, initial_referer')
                    .eq('user_id', user.id)
                    .single();
                  
                  if (profile) {
                    gclid = profile.gclid;
                    
                    // Safely extract url_params from database
                    if (profile.url_params && typeof profile.url_params === 'object' && !Array.isArray(profile.url_params)) {
                      urlParamsObj = profile.url_params as Record<string, string>;
                    }
                    
                    referer = profile.initial_referer || referer;
                  }
                } catch (error) {
                  console.warn('[PAYMENT-WEBHOOK] Failed to fetch stored params from database:', error);
                }
                
                // Fallback to current URL if database fetch failed
                if (!gclid || Object.keys(urlParamsObj).length === 0) {
                  const currentUrlParams = new URLSearchParams(window.location.search);
                  gclid = gclid || currentUrlParams.get('gclid') || localStorage.getItem('gclid') || null;
                  
                  if (Object.keys(urlParamsObj).length === 0) {
                    currentUrlParams.forEach((value, key) => {
                      urlParamsObj[key] = value;
                    });
                  }
                }
                
                // Send payment webhook with proper format
                const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: user.email || userProfile?.phone_number || '',
                    username: userProfile?.display_name || user.email?.split('@')[0] || 'User',
                    country: country,
                    ip_address: ipAddress,
                    user_id: user.id,
                    plan_type: planType,
                    plan_duration: planDuration,
                    plan_price: planPrice,
                    product_id: dbSub.product_id,
                    plan_name: dbSub.plan_name,
                    gclid: gclid,
                    urlParams: JSON.stringify(urlParamsObj), // Stringified JSON from database
                    referer: referer ? String(referer) : "null", // Use fetched referer from database
                    timestamp: new Date().toISOString(),
                    hasDocument: "false"
                  }),
                });
                
                if (webhookResponse.ok) {
                  console.log('✅ Payment webhook sent successfully');
                } else {
                  console.warn('⚠️ Payment webhook failed:', webhookResponse.status);
                }
              } catch (webhookError) {
                console.error('❌ Failed to send payment webhook:', webhookError);
              }
            })();
            
            // Mark as tracked in localStorage to prevent duplicates
            localStorage.setItem(trackedKey, 'true');
            console.log('✅ Payment conversion tracked successfully');
            
            // Clean up URL params after tracking
            if (hasSessionId) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
        }
        
        // Save to sessionStorage for instant load on next page load
        saveCachedSubscription(newStatus);
        
        // Check if we should show pricing modal
        checkAndShowPricingModal(newStatus);
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      // SECURITY: Never trust database - if Stripe check fails, mark as unsubscribed
      console.warn('⚠️ Exception during subscription check - marking as unsubscribed for security');
      const resetStatus = {
        subscribed: false,
        product_id: null,
        subscription_end: null,
        plan: null,
        plan_name: null
      };
      setSubscriptionStatus(resetStatus);
      clearCachedSubscription();
      checkAndShowPricingModal(resetStatus);
    } finally {
      setIsCheckingSubscription(false);
      setLoadingSubscription(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    
    // Clear subscription status and cache
    const resetStatus = {
      subscribed: false,
      product_id: null,
      subscription_end: null,
      plan: null,
      plan_name: null
    };
    setSubscriptionStatus(resetStatus);
    clearCachedSubscription();
    
    // Force page refresh after sign out
    window.location.href = '/';
  };

  // Account Linking Functions
  const linkPhoneNumber = async (phone: string): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      // CRITICAL: For linking phone to existing account, we update the user's phone
      // Supabase will send an OTP for verification
      const { error } = await supabase.auth.updateUser({
        phone: phone
      });

      if (error) {
        console.error('Link phone error:', error);
        return { error };
      }

      console.log('✅ Phone OTP sent for linking:', phone);
      return { error: null };
    } catch (error) {
      console.error('Link phone exception:', error);
      return { error };
    }
  };

  const verifyPhoneLink = async (phone: string, token: string): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      // Verify the phone OTP - this completes the linking
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'phone_change'
      });

      if (error) {
        console.error('Verify phone link error:', error);
        return { error };
      }

      // Update profile with phone number
      await supabase.from('profiles').update({
        phone_number: phone,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);

      console.log('✅ Phone linked successfully:', phone);
      await refreshUserProfile();
      return { error: null };
    } catch (error) {
      console.error('Verify phone link exception:', error);
      return { error };
    }
  };

  const linkEmailPassword = async (email: string, password: string): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      // For phone users wanting to add email/password
      const { error } = await supabase.auth.updateUser({
        email: email,
        password: password
      });

      if (error) {
        // Handle "same password" error when re-linking
        if (error.message?.includes('same password') || error.code === 'same_password') {
          console.log('Re-linking with same credentials, proceeding...');
          // Continue to update profile even if password is the same
        } else {
          console.error('Link email error:', error);
          return { error };
        }
      }

      // Update profile
      await supabase.from('profiles').update({
        email: email,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);

      console.log('✅ Email linked successfully:', email);
      await refreshUserProfile();
      return { error: null };
    } catch (error) {
      console.error('Link email exception:', error);
      return { error };
    }
  };

  const linkGoogleAccount = async (): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      // CRITICAL: Use linkIdentity for OAuth linking
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Link Google error:', error);
        return { error };
      }

      console.log('✅ Google account linking initiated');
      return { error: null };
    } catch (error) {
      console.error('Link Google exception:', error);
      return { error };
    }
  };

  const linkAppleAccount = async (): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      const { error } = await supabase.auth.linkIdentity({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Link Apple error:', error);
        return { error };
      }

      console.log('✅ Apple account linking initiated');
      return { error: null };
    } catch (error) {
      console.error('Link Apple exception:', error);
      return { error };
    }
  };

  const linkMicrosoftAccount = async (): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      const { error } = await supabase.auth.linkIdentity({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false,
          scopes: 'email openid profile'
        }
      });

      if (error) {
        console.error('Link Microsoft error:', error);
        return { error };
      }

      console.log('✅ Microsoft account linking initiated');
      return { error: null };
    } catch (error) {
      console.error('Link Microsoft exception:', error);
      return { error };
    }
  };

  const unlinkAuthMethod = async (provider: string): Promise<{ error: any }> => {
    try {
      if (!user) {
        return { error: { message: 'No user logged in' } };
      }

      // Get user identities to check count
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const identities = currentUser?.identities || [];

      if (identities.length <= 1) {
        return { error: { message: 'Cannot unlink last authentication method. Add another method first.' } };
      }

      // Find the identity to unlink
      const identityToUnlink = identities.find(id => id.provider === provider);
      if (!identityToUnlink) {
        return { error: { message: 'Authentication method not found' } };
      }

      const { error } = await supabase.auth.unlinkIdentity(identityToUnlink);

      if (error) {
        console.error('Unlink error:', error);
        return { error };
      }

      // Update profile and auth.users to remove credentials completely
      if (provider === 'phone') {
        // Clear phone from both auth and profile
        await supabase.auth.updateUser({ phone: '' });
        await supabase.from('profiles').update({
          phone_number: null,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
      } else if (provider === 'email') {
        // Clear email and password from auth.users completely
        // This makes the email available for new signups
        const randomPassword = crypto.randomUUID() + crypto.randomUUID();
        await supabase.auth.updateUser({ 
          email: `deleted-${user.id}@temp.local`, // Temporary email to free up the real one
          password: randomPassword // Set random password to invalidate old credentials
        });
        await supabase.from('profiles').update({
          email: null,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
      } else if (['google', 'apple', 'azure'].includes(provider)) {
        // When unlinking OAuth, also clear email and avatar if signup was not via email/oauth
        const { data: profile } = await supabase
          .from('profiles')
          .select('signup_method')
          .eq('user_id', user.id)
          .single();

        const updateData: any = {
          oauth_provider: null,
          oauth_metadata: null,
          updated_at: new Date().toISOString()
        };

        // If user signed up with phone, also clear email and avatar from OAuth
        if (profile?.signup_method === 'phone') {
          updateData.email = null;
          updateData.avatar_url = null;
        }

        await supabase.from('profiles').update(updateData).eq('user_id', user.id);
      }

      console.log('✅ Authentication method unlinked:', provider);
      await refreshUserProfile();
      return { error: null };
    } catch (error) {
      console.error('Unlink exception:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    loadingSubscription,
    userProfile,
    subscriptionStatus,
    showPricingModal,
    setShowPricingModal,
    checkSubscription,
    refreshUserProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
    // Account linking
    linkPhoneNumber,
    verifyPhoneLink,
    linkEmailPassword,
    linkGoogleAccount,
    linkAppleAccount,
    linkMicrosoftAccount,
    unlinkAuthMethod
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}