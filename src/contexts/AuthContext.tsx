import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { trackPaymentComplete, trackRegistrationComplete } from '@/utils/gtmTracking';
import { fetchIPAndCountry } from '@/utils/webhookMetadata';
import { logUserActivity, getFullTrackingData } from '@/utils/browserTracking';

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

  // Update user profile with comprehensive tracking data on login
  const updateLoginGeoData = async (userId: string) => {
    try {
      const { ip, country } = await fetchIPAndCountry();
      const trackingData = getFullTrackingData('login');
      
      // Log the login activity with full tracking data
      await logUserActivity(userId, 'login');
      
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
      
      // Update geo data for all logins (OAuth and email)
      await updateLoginGeoData(user.id);
      
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
            // Log user activity for ALL logins (email, OAuth, etc.)
            try {
              // Collect browser and device information
              const browserInfo = {
                browser: navigator.userAgent.match(/(?:Firefox|Chrome|Safari|Edge|Opera)\/[\d.]+/)?.[0]?.split('/')[0] || 'Unknown',
                browserVersion: navigator.userAgent.match(/(?:Firefox|Chrome|Safari|Edge|Opera)\/([\d.]+)/)?.[1] || 'Unknown',
                device: /Mobile|Tablet/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                os: navigator.platform || 'Unknown',
                userAgent: navigator.userAgent,
                isMobile: /Mobile/i.test(navigator.userAgent),
                isTablet: /Tablet/i.test(navigator.userAgent),
                isDesktop: !/Mobile|Tablet/i.test(navigator.userAgent),
              };
              
              const deviceInfo = {
                platform: navigator.platform,
                language: navigator.language,
                languages: navigator.languages,
                screenResolution: `${screen.width}x${screen.height}`,
                screenWidth: screen.width,
                screenHeight: screen.height,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                colorDepth: screen.colorDepth,
                devicePixelRatio: window.devicePixelRatio,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                cookiesEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                hardwareConcurrency: navigator.hardwareConcurrency,
                touchSupport: 'ontouchstart' in window
              };
              
              // Call log-user-activity edge function
              await supabase.functions.invoke('log-user-activity', {
                body: {
                  userId: session.user.id,
                  activityType: 'login',
                  browserInfo,
                  deviceInfo,
                  referrer: document.referrer,
                  metadata: {
                    authProvider: session.user.app_metadata?.provider || 'email',
                    signInMethod: event === 'SIGNED_IN' ? 'signin' : 'unknown'
                  }
                }
              });
            } catch (activityError) {
              console.warn('Failed to log user activity:', activityError);
              // Don't block auth flow if activity logging fails
            }
            
            // Check if this is a new signup
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, created_at')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              const profileCreated = new Date(session.user.created_at).getTime();
              const now = Date.now();
              // Profile created within last 10 seconds = new signup
              if ((now - profileCreated) < 10000) {
                trackRegistrationComplete();
                
                // Send subscriber webhook for new user with IP/country from client
                try {
                  // Get IP and country from Cloudflare trace
                  let ipAddress = 'Unknown';
                  let country = 'Unknown';
                  
                  try {
                    const traceResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
                    if (traceResponse.ok) {
                      const traceText = await traceResponse.text();
                      const traceData = Object.fromEntries(
                        traceText.split('\n').map(line => line.split('='))
                      );
                      ipAddress = traceData.ip || 'Unknown';
                      country = traceData.loc || 'Unknown';
                    }
                  } catch (traceError) {
                    console.warn('Failed to get IP/country from Cloudflare:', traceError);
                  }
                  
                  // Fetch signup method from profiles
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('signup_method')
                    .eq('user_id', session.user.id)
                    .single();

                  await supabase.functions.invoke('send-subscriber-webhook', {
                    body: {
                      userId: session.user.id,
                      email: session.user.email,
                      username: session.user.user_metadata?.name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
                      ipAddress,
                      country,
                      signupMethod: profileData?.signup_method || 'email',
                    }
                  });
                } catch (webhookError) {
                  console.error('Failed to send subscriber webhook:', webhookError);
                }
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
      
      // Check for returning from Stripe (both success and failure cases)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const isReturningFromStripe = sessionId || urlParams.has('success');
      
      // Also detect if user was just on Stripe by checking document.referrer
      const comingFromStripe = document.referrer.includes('stripe.com') || document.referrer.includes('checkout.stripe.com');
      
      if (isReturningFromStripe || comingFromStripe) {
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
    
    // Update geo data on successful login
    if (!error && data.user) {
      setTimeout(() => updateLoginGeoData(data.user.id), 0);
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
        
        setSubscriptionStatus(newStatus);
        
        // Check if returning from Stripe checkout (session_id in URL)
        const urlParams = new URLSearchParams(window.location.search);
        const hasSessionId = urlParams.has('session_id');
        
        // Track payment complete if user just upgraded OR returning from Stripe
        const shouldTrack = (!previousSubscribed && newStatus.subscribed) || (hasSessionId && newStatus.subscribed);
        
        if (shouldTrack) {
          // Check if we've already tracked this subscription to prevent duplicates
          const trackedKey = `payment_tracked_${user.id}_${newStatus.product_id}`;
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
              
              // Check for duration indicators
              if (productIdLower.includes('year') || productIdLower.includes('annual') || planNameLower.includes('year') || planNameLower.includes('annual')) {
                planDuration = 'yearly';
                planPrice = planType === 'Ultra' ? 119.99 : 59.99;
              } else if (productIdLower.includes('quarter') || productIdLower.includes('3month') || planNameLower.includes('3 month') || planNameLower.includes('quarter')) {
                planDuration = '3_months';
                planPrice = planType === 'Ultra' ? 99.99 : 49.99;
              }
              // Otherwise keep monthly defaults
            }
            
            console.log('📊 Tracking data:', { planType, planDuration, planPrice, product_id: dbSub.product_id, plan_name: dbSub.plan_name });
            trackPaymentComplete(planType, planDuration, planPrice);
            
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
    resetPassword
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