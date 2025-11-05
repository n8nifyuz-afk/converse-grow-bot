import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { trackPaymentComplete, trackRegistrationComplete, clearTrackingData } from '@/utils/gtmTracking';
import { fetchIPAndCountry } from '@/utils/webhookMetadata';
import { logUserActivity, getFullTrackingData } from '@/utils/browserTracking';
import { cleanIpAddress } from '@/utils/ipFormatter';
import { detectAndUpdateMissingCountry } from '@/utils/countryDetection';

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

// CRITICAL: Universal auth initiation tracking using sessionStorage
// These are exported so components like GoogleOneTab can use them
// This persists across OAuth redirects and page reloads
export const markAuthInitiated = () => {
  sessionStorage.setItem('auth_initiated', 'true');
  sessionStorage.setItem('auth_initiated_time', Date.now().toString());
};

// Helper to check if auth was recently initiated (within last 30 seconds)
export const wasAuthRecentlyInitiated = () => {
  const initiated = sessionStorage.getItem('auth_initiated') === 'true';
  const timeStr = sessionStorage.getItem('auth_initiated_time');
  
  if (!initiated || !timeStr) return false;
  
  const timestamp = parseInt(timeStr);
  const timeSinceInitiation = Date.now() - timestamp;
  const isRecent = timeSinceInitiation < 30000; // 30 seconds
  
  if (!isRecent) {
    // Clear if too old
    clearAuthInitiated();
    return false;
  }
  
  return true;
};

// Helper to clear auth initiated flag
export const clearAuthInitiated = () => {
  sessionStorage.removeItem('auth_initiated');
  sessionStorage.removeItem('auth_initiated_time');
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
  
  // Ref to track last OAuth sync time to prevent 429 rate limiting
  const lastOAuthSyncRef = useRef<number>(0);
  
  // CRITICAL: Track last activity log to prevent duplicates (session token + timestamp)
  const lastActivityLogRef = useRef<{ sessionToken: string; timestamp: number } | null>(null);

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

  // Sync OAuth profile data (Google, Apple, Microsoft) AND phone signups on sign-in
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
      
      // Detect phone signup: user has phone but no OAuth provider
      const isPhoneSignIn = 
        user.phone && 
        !isGoogleSignIn && 
        !isAppleSignIn && 
        !isMicrosoftSignIn &&
        metadata?.signup_method === 'phone';
      
      const provider = isGoogleSignIn ? 'google' : isAppleSignIn ? 'apple' : isMicrosoftSignIn ? 'microsoft' : isPhoneSignIn ? 'phone' : 'email';
      
      // REMOVED: updateLoginGeoData call - profile is already updated by log-user-activity edge function
      
      // Only sync profile data for OAuth providers and phone signups
      // Email-only signups don't need this sync as they're handled separately
      if (!isGoogleSignIn && !isAppleSignIn && !isMicrosoftSignIn && !isPhoneSignIn) return;
      
      // Get current profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      
      // Get browser and device tracking data
      const trackingData = getFullTrackingData('login');
      
      // Extract comprehensive OAuth data - STORE EVERYTHING
      const updateData: any = {
        updated_at: new Date().toISOString(),
        browser_info: JSON.parse(JSON.stringify(trackingData.browserInfo)),
        device_info: JSON.parse(JSON.stringify(trackingData.deviceInfo))
      };
      
      // Set oauth_provider and oauth_metadata only for OAuth providers, not for phone
      if (isGoogleSignIn || isAppleSignIn || isMicrosoftSignIn) {
        updateData.oauth_provider = provider;
        updateData.oauth_metadata = metadata; // Store COMPLETE OAuth metadata for admin analysis
      }
      
      // CRITICAL: Check if webhook was already sent for this user (deduplication)
      const webhookSentKey = `webhook_sent_${user.id}`;
      const webhookAlreadySent = localStorage.getItem(webhookSentKey);
      
      // IMPROVED: Check if this is a NEW signup by checking user creation time
      // User created within last 5 minutes = new signup (works for ALL auth methods including phone)
      // Extended to 5 minutes to account for phone OTP verification and profile completion flow
      const userCreatedAt = new Date(user.created_at).getTime();
      const timeSinceCreation = Date.now() - userCreatedAt;
      const isNewSignup = timeSinceCreation < 300000; // 5 minutes (300 seconds)
      
      // Determine if we should send webhook (new signup AND webhook not sent yet)
      const shouldSendWebhook = isNewSignup && !webhookAlreadySent;
      
      console.log(`[WEBHOOK-CHECK] User: ${user.id}, Created: ${new Date(user.created_at).toISOString()}, Age: ${timeSinceCreation}ms, IsNew: ${isNewSignup}, AlreadySent: ${!!webhookAlreadySent}, ShouldSend: ${shouldSendWebhook}`);
      
      // CRITICAL: For new signups, fetch IP and country if missing
      if (isNewSignup && (!currentProfile?.ip_address || !currentProfile?.country)) {
        try {
          const { ip, country } = await fetchIPAndCountry();
          if (ip && !currentProfile?.ip_address) {
            updateData.ip_address = cleanIpAddress(ip);
          }
          if (country && !currentProfile?.country) {
            updateData.country = country;
          }
        } catch (error) {
          console.error('[OAuth Profile Sync] Failed to fetch IP/country:', error);
        }
      }
      
      // CRITICAL: For new signups, ensure tracking data is synced from localStorage to database
      // On subsequent logins, preserve existing tracking data
      if (isNewSignup) {
        const gclid = localStorage.getItem('gclid');
        const storedUrlParams = localStorage.getItem('url_params');
        const storedReferer = localStorage.getItem('initial_referer');
        
        console.log('═══════════════════════════════════════════════════');
        console.log('🆕 [NEW-SIGNUP] Syncing campaign tracking data...');
        console.log('📍 [NEW-SIGNUP] GCLID from localStorage:', gclid);
        console.log('📍 [NEW-SIGNUP] URL params from localStorage:', storedUrlParams);
        console.log('📍 [NEW-SIGNUP] Referer from localStorage:', storedReferer);
        console.log('📊 [NEW-SIGNUP] Current profile data:', {
          gclid: currentProfile?.gclid,
          url_params: currentProfile?.url_params,
          initial_referer: currentProfile?.initial_referer
        });
        
        // Save GCLID from localStorage if database doesn't have it
        if (gclid && !currentProfile?.gclid) {
          updateData.gclid = gclid;
          console.log('✅ [NEW-SIGNUP] Adding GCLID to profile:', gclid);
        }
        
        // Save url_params from localStorage if database doesn't have it
        if (storedUrlParams && !currentProfile?.url_params) {
          try {
            updateData.url_params = JSON.parse(storedUrlParams);
            console.log('✅ [NEW-SIGNUP] Adding URL params to profile:', updateData.url_params);
          } catch (e) {
            console.error('❌ [NEW-SIGNUP] Failed to parse url_params:', e);
          }
        }
        
        // Save initial_referer from localStorage if database doesn't have it
        const referer = storedReferer || document.referrer || 'Direct';
        if (referer && referer !== 'Direct' && !currentProfile?.initial_referer) {
          updateData.initial_referer = referer;
          console.log('✅ [NEW-SIGNUP] Adding referer to profile:', referer);
        }
        
        console.log('═══════════════════════════════════════════════════');
      } else {
        // On subsequent logins, ALWAYS preserve existing tracking data (never update)
        console.log('🔄 [EXISTING-USER] Preserving campaign tracking data...');
        
        if (currentProfile?.gclid) {
          updateData.gclid = currentProfile.gclid;
          console.log('🔒 [EXISTING-USER] Preserving GCLID:', currentProfile.gclid);
        }
        if (currentProfile?.url_params) {
          updateData.url_params = currentProfile.url_params;
          console.log('🔒 [EXISTING-USER] Preserving URL params');
        }
        if (currentProfile?.initial_referer) {
          updateData.initial_referer = currentProfile.initial_referer;
          console.log('🔒 [EXISTING-USER] Preserving referer:', currentProfile.initial_referer);
        }
      }

      
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
      // CRITICAL: Always update profile for OAuth signups (even if minimal changes)
      // This ensures tracking data (GCLID, url_params) is saved to database
      if (currentProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id)
          .select();
        
        if (error) {
          console.error('[OAuth Profile Sync] Profile update failed:', error);
          throw error;
        }
      }
      
      // CRITICAL: Send webhook for new OAuth signups (with proper deduplication)
      if (shouldSendWebhook) {
        try {
          // Fetch the FINAL profile state with all tracking data
          const { data: finalProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          // Fetch IP and country if not already available
          let ipAddress = finalProfile?.ip_address || updateData.ip_address;
          let country = finalProfile?.country || updateData.country;
          
          if (!ipAddress || !country) {
            try {
              const { ip, country: ipCountry } = await fetchIPAndCountry();
              ipAddress = ipAddress || ip;
              country = country || ipCountry;
            } catch (error) {
              // Silent error
            }
          }
          
          // Parse url_params to ensure correct format (object, not string)
          let urlParams = finalProfile?.url_params || updateData.url_params || {};
          if (typeof urlParams === 'string') {
            try {
              urlParams = JSON.parse(urlParams);
            } catch (e) {
              urlParams = {};
            }
          }
          
          const webhookData = {
            userId: user.id,
            email: user.email || finalProfile?.email || finalProfile?.phone_number || user.phone,
            username: finalProfile?.display_name || updateData.display_name || 'User',
            ipAddress: ipAddress || null,
            country: country || null,
            signupMethod: provider,
            gclid: finalProfile?.gclid || updateData.gclid || null,
            urlParams: urlParams, // Already an object
            referer: finalProfile?.initial_referer || updateData.initial_referer || null
          };
          
          const webhookResponse = await fetch(
            'https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/send-subscriber-webhook',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(webhookData)
            }
          );
          
          if (webhookResponse.ok) {
            // Mark webhook as sent (deduplication)
            localStorage.setItem(webhookSentKey, new Date().toISOString());
          } else {
            const errorText = await webhookResponse.text();
            console.error('❌ [OAuth Profile Sync] Webhook failed:', errorText);
          }
        } catch (webhookError) {
          console.error('[OAuth Profile Sync] ❌ Webhook error:', webhookError);
        }
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
        
        // CRITICAL: Automatically detect and update missing country
        if (!existingProfile.country) {
          detectAndUpdateMissingCountry(userId).catch(console.error);
        }
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
    let authStateDebounceTimer: NodeJS.Timeout | null = null;
    
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
        // Clear any pending debounce timer
        if (authStateDebounceTimer) {
          clearTimeout(authStateDebounceTimer);
        }
        
        // CRITICAL: Only synchronous state updates here to prevent auth loops
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Clean URL - remove hash fragments from OAuth redirects AFTER session is established
          if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
          // CRITICAL: Only log activity on ACTUAL sign-in/sign-up events with strict deduplication
          // This works for ALL auth methods: OAuth, email/password, phone, Google One Tap
          
          const now = Date.now();
          const lastLog = lastActivityLogRef.current;
          const isNewSession = !lastLog || lastLog.sessionToken !== session.access_token;
          
          // Check if user explicitly initiated auth (via any method)
          const wasInitiated = wasAuthRecentlyInitiated();
          
          // Only log if user explicitly initiated auth AND this is a new session
          const shouldLogActivity = wasInitiated && isNewSession;
          
          if (shouldLogActivity) {
            // Clear the auth initiated flag after using it
            clearAuthInitiated();
            
            // Detect if this is a SIGNUP or LOGIN
            const userCreatedAt = new Date(session.user.created_at).getTime();
            const timeSinceCreation = now - userCreatedAt;
            const isSignup = timeSinceCreation < 10000; // User created within last 10 seconds = signup
            const activityType = isSignup ? 'signup' : 'login';
            
            // Update last activity log tracking
            lastActivityLogRef.current = {
              sessionToken: session.access_token,
              timestamp: now
            };
            
            // Log activity to database (signup or login)
            logUserActivity(session.user.id, activityType).catch(() => {
              // Silent error
            });
          } else {
            // Session restoration - skip logging
          }
          
          // CRITICAL: Sync OAuth profile immediately but prevent rapid-fire calls
          // Use a ref to track last sync time (resets on page reload, not tab visibility)
          const lastSync = lastOAuthSyncRef.current || 0;
          const timeSinceLastSync = now - lastSync;
          
          // Sync immediately if:
          // 1. First sync (lastSync = 0) - captures new signups instantly
          // 2. Or more than 30 seconds since last sync - prevents 429 from rapid tab switches
          if (timeSinceLastSync === now || timeSinceLastSync > 30000) {
            lastOAuthSyncRef.current = now;
            
            syncOAuthProfile(session).catch(error => {
              console.error('❌ [Auth] Failed to sync OAuth profile:', error);
            });
          }
          
          // Debounce other async operations to prevent rate limiting
          authStateDebounceTimer = setTimeout(async () => {
            // Track registration completion for GTM/GA (with deduplication)
            trackRegistrationComplete();
            
            // Fetch profile and check subscription - DEBOUNCED
            await fetchUserProfile(session.user.id);
            await checkSubscription();
          }, 500); // 500ms debounce to prevent rapid-fire API calls
        } else if (event === 'SIGNED_OUT') {
          // Clear debounce timer on sign out
          if (authStateDebounceTimer) {
            clearTimeout(authStateDebounceTimer);
          }
          
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
          
          // Clear activity log timestamp to prevent rate limit issues on re-login
          sessionStorage.removeItem('last_activity_log');
          sessionStorage.removeItem('pricing_modal_shown_auth');
        } else if (event === 'TOKEN_REFRESHED') {
          // Only update session, don't trigger API calls to avoid rate limits
          setSession(session);
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
      // Clear any pending debounce timer on unmount
      if (authStateDebounceTimer) {
        clearTimeout(authStateDebounceTimer);
      }
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
    
    console.log('🔍 [EMAIL-SIGNUP] Starting geo data fetch...');
    try {
      const geoResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      if (geoResponse.ok) {
        const text = await geoResponse.text();
        const geoData = Object.fromEntries(
          text.trim().split('\n').map(line => line.split('='))
        );
        ipAddress = geoData.ip;
        country = geoData.loc;
        console.log('✅ [EMAIL-SIGNUP] Geo data fetched:', { ipAddress, country });
      }
    } catch (geoError) {
      // Silently fail - continue signup without geo data
      console.error('❌ [EMAIL-SIGNUP] Failed to fetch geo data:', geoError);
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
    
    // CRITICAL: Add Google Ads tracking data from localStorage (stored by GTM)
    const gclid = localStorage.getItem('gclid');
    if (gclid) {
      signupData.gclid = gclid;
      console.log('✅ [EMAIL-SIGNUP] GCLID found:', gclid);
    } else {
      console.log('⚠️ [EMAIL-SIGNUP] No GCLID in localStorage');
    }
    
    const urlParamsStr = localStorage.getItem('url_params');
    if (urlParamsStr) {
      try {
        signupData.url_params = JSON.parse(urlParamsStr);
        console.log('✅ [EMAIL-SIGNUP] URL params found:', signupData.url_params);
      } catch (e) {
        console.error('❌ [EMAIL-SIGNUP] Failed to parse url_params:', e);
      }
    } else {
      console.log('⚠️ [EMAIL-SIGNUP] No url_params in localStorage');
    }
    
    // Capture referer for attribution
    const referer = document.referrer || 'Direct';
    if (referer && referer !== 'Direct') {
      signupData.referer = referer;
      console.log('✅ [EMAIL-SIGNUP] Referer:', referer);
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('📧 [EMAIL-SIGNUP] Complete signup data:');
    console.log(JSON.stringify(signupData, null, 2));
    console.log('═══════════════════════════════════════════════════');
    
    const { error, data} = await supabase.auth.signUp({
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
    // Mark that user explicitly initiated authentication
    markAuthInitiated();
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Activity logging is now handled centrally in onAuthStateChange
    
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
    console.log('🔐 [GOOGLE SIGNIN] Initiating Google sign-in...');
    
    // CRITICAL: Store current URL params in localStorage BEFORE OAuth redirect
    const currentParams = new URLSearchParams(window.location.search);
    const gclid = currentParams.get('gclid');
    const urlParamsObj: Record<string, string> = {};
    currentParams.forEach((value, key) => {
      // Skip internal/system parameters
      if (!key.startsWith('__') && key !== 'code' && key !== 'state') {
        urlParamsObj[key] = value;
      }
    });
    
    if (gclid) {
      localStorage.setItem('gclid', gclid);
      console.log('🔐 [GOOGLE SIGNIN] Stored GCLID before redirect:', gclid);
    }
    if (Object.keys(urlParamsObj).length > 0) {
      localStorage.setItem('url_params', JSON.stringify(urlParamsObj));
      console.log('🔐 [GOOGLE SIGNIN] Stored URL params before redirect:', urlParamsObj);
    }
    
    // Store initial referer
    const referer = document.referrer || 'Direct';
    if (referer && referer !== 'Direct') {
      localStorage.setItem('initial_referer', referer);
    }
    
    // Fetch IP and country for immediate capture
    let ipAddress = null;
    let country = null;
    try {
      const ipData = await fetchIPAndCountry();
      ipAddress = ipData.ip;
      country = ipData.country;
    } catch (error) {
      // Silent error
    }
    
    // Build redirect URL with ALL preserved URL parameters (not just gclid)
    let redirectUrl = `${window.location.origin}`;
    if (Object.keys(urlParamsObj).length > 0) {
      const params = new URLSearchParams(urlParamsObj);
      redirectUrl += `?${params.toString()}`;
    }
    
    // Mark that we're initiating OAuth login
    markAuthInitiated();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    return { error };
  };

  const signInWithApple = async () => {
    // CRITICAL: Store current URL params in localStorage BEFORE OAuth redirect
    const currentParams = new URLSearchParams(window.location.search);
    const gclid = currentParams.get('gclid');
    const urlParamsObj: Record<string, string> = {};
    currentParams.forEach((value, key) => {
      urlParamsObj[key] = value;
    });
    
    if (gclid) {
      localStorage.setItem('gclid', gclid);
    }
    if (Object.keys(urlParamsObj).length > 0) {
      localStorage.setItem('url_params', JSON.stringify(urlParamsObj));
    }
    
    // Store initial referer
    const referer = document.referrer || 'Direct';
    if (referer && referer !== 'Direct') {
      localStorage.setItem('initial_referer', referer);
    }
    
    // Build redirect URL with ALL preserved URL parameters (not just gclid)
    let redirectUrl = `${window.location.origin}`;
    if (Object.keys(urlParamsObj).length > 0) {
      const params = new URLSearchParams(urlParamsObj);
      redirectUrl += `?${params.toString()}`;
    }
    
    // Mark that we're initiating OAuth login
    markAuthInitiated();
    
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
    // CRITICAL: Store current URL params in localStorage BEFORE OAuth redirect
    const currentParams = new URLSearchParams(window.location.search);
    const gclid = currentParams.get('gclid');
    const urlParamsObj: Record<string, string> = {};
    currentParams.forEach((value, key) => {
      urlParamsObj[key] = value;
    });
    
    if (gclid) {
      localStorage.setItem('gclid', gclid);
      console.log('[OAuth] Stored GCLID before redirect:', gclid);
    }
    if (Object.keys(urlParamsObj).length > 0) {
      localStorage.setItem('url_params', JSON.stringify(urlParamsObj));
      console.log('[OAuth] Stored URL params before redirect:', urlParamsObj);
    }
    
    // Store initial referer
    const referer = document.referrer || 'Direct';
    if (referer && referer !== 'Direct') {
      localStorage.setItem('initial_referer', referer);
      console.log('[OAuth] Stored referer before redirect:', referer);
    }
    
    // Build redirect URL with ALL preserved URL parameters (not just gclid)
    let redirectUrl = `${window.location.origin}`;
    if (Object.keys(urlParamsObj).length > 0) {
      const params = new URLSearchParams(urlParamsObj);
      redirectUrl += `?${params.toString()}`;
      console.log('[OAuth] Preserving ALL URL parameters in redirect:', urlParamsObj);
    }
    
    // Mark that we're initiating OAuth login
    markAuthInitiated();
    
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
    // Mark that user explicitly initiated authentication
    markAuthInitiated();
    
    // Get IP address and country using Cloudflare trace (supports CORS)
    let ipAddress: string | undefined;
    let country: string | undefined;
    
    console.log('🔍 [PHONE-SIGNUP] Starting geo data fetch...');
    try {
      const geoResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      if (geoResponse.ok) {
        const text = await geoResponse.text();
        const geoData = Object.fromEntries(
          text.trim().split('\n').map(line => line.split('='))
        );
        ipAddress = geoData.ip;
        country = geoData.loc;
        console.log('✅ [PHONE-SIGNUP] Geo data fetched:', { ipAddress, country });
      }
    } catch (geoError) {
      console.error('❌ [PHONE-SIGNUP] Failed to fetch geo data:', geoError);
    }
    
    const signupData: any = {
      signup_method: 'phone'
    };
    
    if (ipAddress) {
      signupData.ip_address = ipAddress;
    }
    
    if (country) {
      signupData.country = country;
    }
    
    // CRITICAL: Add Google Ads tracking data from localStorage
    console.log('🔍 [PHONE-SIGNUP] Checking localStorage for tracking data...');
    const gclid = localStorage.getItem('gclid');
    if (gclid) {
      signupData.gclid = gclid;
      console.log('✅ [PHONE-SIGNUP] GCLID found:', gclid);
    } else {
      console.log('⚠️ [PHONE-SIGNUP] No GCLID in localStorage');
    }
    
    const urlParamsStr = localStorage.getItem('url_params');
    if (urlParamsStr) {
      try {
        signupData.url_params = JSON.parse(urlParamsStr);
        console.log('✅ [PHONE-SIGNUP] URL params found:', signupData.url_params);
      } catch (e) {
        console.error('❌ [PHONE-SIGNUP] Failed to parse url_params:', e);
      }
    } else {
      console.log('⚠️ [PHONE-SIGNUP] No url_params in localStorage');
    }
    
    // Use initial_referer from localStorage (captures original traffic source)
    const initialReferer = localStorage.getItem('initial_referer');
    if (initialReferer) {
      signupData.referer = initialReferer;
      console.log('✅ [PHONE-SIGNUP] Initial referer captured:', initialReferer);
    } else {
      console.log('⚠️ [PHONE-SIGNUP] No initial_referer in localStorage');
    }
    
    console.log('📤 [PHONE-SIGNUP] Calling supabase.auth.signInWithOtp with data:', signupData);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: signupData
      }
    });
    
    if (error) {
      console.error('❌ [PHONE-SIGNUP] Signup failed:', error);
    } else {
      console.log('✅ [PHONE-SIGNUP] OTP sent successfully');
      console.log('📋 [PHONE-SIGNUP] Complete signup data sent to Supabase:', signupData);
    }
    
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    // Mark that user explicitly initiated authentication (OTP verification)
    markAuthInitiated();
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    // Activity logging is now handled centrally in onAuthStateChange
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

  // Rate limiting for checkSubscription to prevent excessive API calls
  let lastSubscriptionCheck = 0;
  const SUBSCRIPTION_CHECK_COOLDOWN = 5000; // 5 seconds minimum between checks

  const checkSubscription = async () => {
    // CRITICAL: Rate limit to prevent excessive API calls (429 errors)
    const now = Date.now();
    if (now - lastSubscriptionCheck < SUBSCRIPTION_CHECK_COOLDOWN) {
      console.log('[SUBSCRIPTION] Skipping check - too soon since last check');
      return;
    }
    
    if (!user || isCheckingSubscription) {
      if (!user) {
        // Don't clear cache here - keep existing subscription status
        // Only reset the loading state
        setLoadingSubscription(false);
      }
      return;
    }

    lastSubscriptionCheck = now;
    setIsCheckingSubscription(true);
    setLoadingSubscription(true);
    try {
      // CRITICAL: First try to restore subscription from Stripe if missing locally
      // This handles cases where users delete their account and re-register
      if (user.email) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.access_token) {
            const { data: restoreData, error: restoreError } = await supabase.functions.invoke('restore-user-subscription', {
              body: {
                userId: user.id,
                userEmail: user.email
              },
              headers: {
                Authorization: `Bearer ${currentSession.access_token}`,
              },
            });
            
            // Track restored subscriptions in GTM/GA
            if (restoreData?.restored && restoreData?.plan) {
              console.log('🎯 Tracking restored subscription to Google Analytics...', restoreData);
              
              // Map plan to planType
              const planType = restoreData.plan === 'ultra_pro' ? 'Ultra' : 'Pro';
              
              // Determine duration and price from plan_name
              let planDuration: 'monthly' | '3_months' | 'yearly' = 'monthly';
              let planPrice = planType === 'Ultra' ? 39.99 : 19.99; // Default monthly prices
              
              const planNameLower = (restoreData.plan_name || '').toLowerCase();
              
              if (planNameLower.includes('trial') || planNameLower.includes('3 day')) {
                planDuration = '3_months';
                planPrice = 0.99; // 3-day trial price
              } else if (planNameLower.includes('year') || planNameLower.includes('annual')) {
                planDuration = 'yearly';
                planPrice = planType === 'Ultra' ? 119.99 : 59.99;
              } else if (planNameLower.includes('3 month') || planNameLower.includes('quarter')) {
                planDuration = '3_months';
                planPrice = planType === 'Ultra' ? 99.99 : 49.99;
              }
              
              console.log('📊 Restored subscription tracking data:', { planType, planDuration, planPrice, plan: restoreData.plan, plan_name: restoreData.plan_name });
              trackPaymentComplete(planType, planDuration, planPrice);
            }
          }
        } catch (restoreError) {
          // Silent error - continue with normal subscription check
          console.log('[SUBSCRIPTION] Restore check completed');
        }
      }
      
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
        
        // CRITICAL FIX: If database shows active subscription but edge function returns false,
        // trust the database (handles edge function timeout/failure cases)
        const dbHasActiveSubscription = dbSub && new Date(dbSub.current_period_end) > new Date();
        
        const previousSubscribed = subscriptionStatus.subscribed;
        const newStatus = {
          subscribed: dbHasActiveSubscription ? true : (data.subscribed || false),
          product_id: dbHasActiveSubscription ? dbSub.product_id : (data.product_id || null),
          subscription_end: dbHasActiveSubscription ? dbSub.current_period_end : (data.subscription_end || null),
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
    // IMPORTANT: Use 'local' scope to only sign out from current device/browser
    // This prevents signing out from all devices when user just wants to log out locally
    await supabase.auth.signOut({ scope: 'local' });
    
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
    
    // Clear tracking data to prevent cross-user contamination
    clearTrackingData();
    
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

      // Mark that user explicitly initiated authentication
      markAuthInitiated();

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

      // Mark that user explicitly initiated authentication
      markAuthInitiated();

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

      // Mark that user explicitly initiated authentication
      markAuthInitiated();

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
      console.log('🔓 [UNLINK] Starting unlink process for provider:', provider);
      
      if (!user) {
        console.error('🔓 [UNLINK] No user logged in');
        return { error: { message: 'No user logged in' } };
      }

      console.log('🔓 [UNLINK] Current user ID:', user.id);

      // Get user identities to check count
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const identities = currentUser?.identities || [];

      console.log('🔓 [UNLINK] Current identities:', identities.map(id => ({
        provider: id.provider,
        id: id.id,
        identity_id: id.identity_id
      })));

      if (identities.length <= 1) {
        console.error('🔓 [UNLINK] Cannot unlink - this is the last authentication method');
        return { error: { message: 'Cannot unlink last authentication method. Add another method first.' } };
      }

      // Find the identity to unlink
      const identityToUnlink = identities.find(id => id.provider === provider);
      if (!identityToUnlink) {
        console.error('🔓 [UNLINK] Identity not found for provider:', provider);
        return { error: { message: 'Authentication method not found' } };
      }

      console.log('🔓 [UNLINK] Unlinking identity:', {
        provider: identityToUnlink.provider,
        identity_id: identityToUnlink.identity_id,
        id: identityToUnlink.id
      });

      const { error } = await supabase.auth.unlinkIdentity(identityToUnlink);

      if (error) {
        console.error('🔓 [UNLINK] Failed to unlink identity:', error);
        return { error };
      }

      console.log('🔓 [UNLINK] Identity unlinked successfully from Supabase auth');

      // CRITICAL: Refresh session to ensure identity list is updated immediately
      console.log('🔓 [UNLINK] Refreshing session to update identity list...');
      await supabase.auth.refreshSession();

      // Update profile and auth.users to remove credentials completely
      if (provider === 'phone') {
        console.log('🔓 [UNLINK] Clearing phone credentials from auth and profile...');
        // Clear phone from both auth and profile
        await supabase.auth.updateUser({ phone: '' });
        await supabase.from('profiles').update({
          phone_number: null,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
        console.log('🔓 [UNLINK] Phone cleared successfully');
      } else if (provider === 'email') {
        console.log('🔓 [UNLINK] Clearing email credentials from auth...');
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
        console.log('🔓 [UNLINK] Email cleared successfully');
      } else if (['google', 'apple', 'azure'].includes(provider)) {
        console.log('🔓 [UNLINK] Processing OAuth provider unlink...');
        // When unlinking OAuth, also clear email and avatar if signup was not via email/oauth
        const { data: profile } = await supabase
          .from('profiles')
          .select('signup_method')
          .eq('user_id', user.id)
          .single();

        console.log('🔓 [UNLINK] User signup method:', profile?.signup_method);

        const updateData: any = {
          oauth_provider: null,
          oauth_metadata: null,
          external_id: null, // CRITICAL: Clear external_id to allow re-signup with same OAuth account
          updated_at: new Date().toISOString()
        };

        // If user signed up with phone, also clear email and avatar from OAuth
        if (profile?.signup_method === 'phone') {
          console.log('🔓 [UNLINK] Phone signup detected - clearing OAuth email and avatar');
          updateData.email = null;
          updateData.avatar_url = null;
        }

        console.log('🔓 [UNLINK] Updating profile with:', updateData);
        await supabase.from('profiles').update(updateData).eq('user_id', user.id);
        console.log('🔓 [UNLINK] OAuth profile data cleared successfully');
      }

      console.log('🔓 [UNLINK] ✅ Authentication method unlinked successfully:', provider);
      console.log('🔓 [UNLINK] Refreshing user profile...');
      await refreshUserProfile();
      
      // Get final identities after unlink
      const { data: { user: finalUser } } = await supabase.auth.getUser();
      console.log('🔓 [UNLINK] Remaining identities after unlink:', 
        finalUser?.identities?.map(id => ({
          provider: id.provider,
          id: id.id
        }))
      );
      
      return { error: null };
    } catch (error) {
      console.error('🔓 [UNLINK] ❌ Unlink exception:', error);
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