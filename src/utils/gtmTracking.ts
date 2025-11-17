// Google Tag Manager tracking utilities

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// GCLID expiration: 90 days (Google Ads standard)
const GCLID_EXPIRY_DAYS = 90;
const GCLID_EXPIRY_MS = GCLID_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Check if stored GCLID has expired (90 days)
 */
const isGCLIDExpired = (): boolean => {
  const timestamp = localStorage.getItem('gclid_timestamp');
  if (!timestamp) return true;
  
  const age = Date.now() - parseInt(timestamp);
  return age > GCLID_EXPIRY_MS;
};

/**
 * Clear all tracking data (GCLID, URL params, timestamps)
 * Call this on logout to prevent cross-user contamination
 */
export const clearTrackingData = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('gclid');
    localStorage.removeItem('gbraid');
    localStorage.removeItem('wbraid');
    localStorage.removeItem('gclid_timestamp');
    localStorage.removeItem('url_params');
    localStorage.removeItem('url_params_timestamp');
  } catch (error) {
    // Silent error
  }
};

/**
 * Get GA4 client_id from _ga cookie
 * Format: GA1.1.1234567890.9876543210
 * Returns: "1234567890.9876543210"
 */
export const getGaClientId = (): string | null => {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
    if (!match) return null;
    
    const parts = decodeURIComponent(match[1]).split('.');
    // Expected: GA1.1.1234567890.9876543210
    if (parts.length < 4) return null;
    
    return parts[2] + '.' + parts[3]; // "1234567890.9876543210"
  } catch (error) {
    console.error('Error getting GA client_id:', error);
    return null;
  }
};

/**
 * Get Google Ads identifiers from URL
 * Returns: { gclid, gbraid, wbraid }
 */
export const getGoogleAdsIdsFromUrl = (): Record<string, string> => {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const ids: Record<string, string> = {};
  
  ['gclid', 'gbraid', 'wbraid'].forEach((key) => {
    const val = params.get(key);
    if (val) ids[key] = val;
  });
  
  return ids;
};

/**
 * Persist Google Ads IDs in localStorage
 */
export const persistGoogleAdsIds = (ids: Record<string, string>) => {
  if (!ids || Object.keys(ids).length === 0) return;
  
  try {
    Object.entries(ids).forEach(([key, value]) => {
      localStorage.setItem(key, value);
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    });
  } catch (error) {
    console.error('Error persisting Google Ads IDs:', error);
  }
};

/**
 * Get stored Google Ads IDs from localStorage
 */
export const getStoredGoogleAdsIds = (): Record<string, string> => {
  const ids: Record<string, string> = {};
  
  try {
    ['gclid', 'gbraid', 'wbraid'].forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) ids[key] = value;
    });
  } catch (error) {
    console.error('Error getting stored Google Ads IDs:', error);
  }
  
  return ids;
};

/**
 * Initialize GTM with GCLID and URL parameters
 * This should be called on app initialization
 */
export const initializeGTMWithGCLID = () => {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  
  try {
    // Capture Google Ads IDs from URL
    const adsIds = getGoogleAdsIdsFromUrl();
    if (Object.keys(adsIds).length > 0) {
      persistGoogleAdsIds(adsIds);
    }
    
    // Get GCLID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const gclidFromUrl = urlParams.get('gclid');
    const gclidFromStorage = localStorage.getItem('gclid');
    
    // Check if stored GCLID has expired
    const hasExpiredGCLID = gclidFromStorage && isGCLIDExpired();
    if (hasExpiredGCLID) {
      clearTrackingData();
    }
    
    const gclid = gclidFromUrl || (hasExpiredGCLID ? null : gclidFromStorage);

    // Store GCLID with timestamp if found in URL
    if (gclidFromUrl && !gclidFromStorage) {
      localStorage.setItem('gclid', gclidFromUrl);
      localStorage.setItem('gclid_timestamp', Date.now().toString());
    }

    // Collect all URL parameters for attribution
    const allUrlParams: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      if (!key.startsWith('__') && key !== 'code' && key !== 'state') {
        allUrlParams[key] = value;
      }
    });

    // Merge with stored params (preserves first-touch attribution)
    const storedParams = localStorage.getItem('url_params');
    const mergedParams = storedParams ? 
      { ...JSON.parse(storedParams), ...allUrlParams } : 
      allUrlParams;

    if (Object.keys(allUrlParams).length > 0) {
      localStorage.setItem('url_params', JSON.stringify(mergedParams));
      localStorage.setItem('url_params_timestamp', Date.now().toString());
    }

    // Push to dataLayer if we have tracking data
    if (gclid || Object.keys(mergedParams).length > 0) {
      const eventData: any = {
        event: 'gtm_init',
        url_params: mergedParams
      };
      
      if (gclid) {
        eventData.gclid = gclid;
      }
      
      window.dataLayer.push(eventData);
    }
  } catch (error) {
    console.error('Error initializing GTM:', error);
  }
};

/**
 * Wait for GTM to be loaded
 */
export const waitForGTM = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.dataLayer) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.dataLayer) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });
};

/**
 * Get current GCLID from URL or localStorage
 */
export const getCurrentGCLID = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const gclidFromUrl = urlParams.get('gclid');
  
  if (gclidFromUrl) return gclidFromUrl;
  
  const gclidFromStorage = localStorage.getItem('gclid');
  if (gclidFromStorage && !isGCLIDExpired()) {
    return gclidFromStorage;
  }
  
  return null;
};

/**
 * Track sign_up event
 * Fire after the backend confirms account creation
 */
export const trackSignUp = async (userId: string, method: string, signupFlow?: string) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      const gclid = getCurrentGCLID();
      const urlParams = localStorage.getItem('url_params');
      const parsedParams = urlParams ? JSON.parse(urlParams) : {};
      
      const eventData: any = {
        event: 'sign_up',
        user_id: userId,
        method: method, // google|facebook|microsoft|apple|manual
      };
      
      if (signupFlow) {
        eventData.signup_flow = signupFlow;
      }
      
      if (gclid) {
        eventData.gclid = gclid;
      }
      
      if (Object.keys(parsedParams).length > 0) {
        eventData.url_params = parsedParams;
      }
      
      window.dataLayer.push(eventData);
    } catch (error) {
      console.error('Error tracking sign_up:', error);
    }
  }
};

/**
 * Track login event
 * Fire on successful login / token issued, not every page load
 */
export const trackLogin = async (userId: string, method: string) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      const eventData: any = {
        event: 'login',
        user_id: userId,
        method: method, // google|facebook|microsoft|apple|password
        interface: 'web'
      };
      
      window.dataLayer.push(eventData);
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  }
};

/**
 * Track chat_start event
 * Fire when the user sends the first message in a conversation
 */
export const trackChatStart = async (
  userId: string,
  conversationId: string,
  modelName: string,
  isNewConversation: boolean = true
) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      // Check if this chat has already been tracked
      const trackedChats = sessionStorage.getItem('gtm_tracked_chats') || '';
      const trackedKey = `${userId}:${conversationId}`;
      
      if (trackedChats.includes(trackedKey)) {
        return;
      }
      
      const eventData: any = {
        event: 'chat_start',
        user_id: userId,
        conversation_id: conversationId,
        model_name: modelName,
        interface: 'web',
        is_new_conversation: isNewConversation
      };
      
      window.dataLayer.push(eventData);
      
      // Mark this chat as tracked
      const newTrackedChats = trackedChats ? `${trackedChats},${trackedKey}` : trackedKey;
      sessionStorage.setItem('gtm_tracked_chats', newTrackedChats);
    } catch (error) {
      console.error('Error tracking chat_start:', error);
    }
  }
};

/**
 * Track project_create event
 * Fire when user creates a new folder/project
 */
export const trackProjectCreate = async (
  userId: string,
  projectId: string,
  projectName: string,
  entityType: 'folder' | 'project' = 'project',
  templateUsed?: string
) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      const eventData: any = {
        event: 'project_create',
        user_id: userId,
        project_id: projectId,
        project_name: projectName,
        entity_type: entityType,
      };
      
      if (templateUsed) {
        eventData.template_used = templateUsed;
      }
      
      window.dataLayer.push(eventData);
    } catch (error) {
      console.error('Error tracking project_create:', error);
    }
  }
};

/**
 * Track begin_checkout event
 * Fire after Stripe Checkout session is successfully created and right before redirecting
 */
export const trackBeginCheckout = async (
  userId: string,
  planId: string,
  planName: string,
  billingPeriod: 'monthly' | 'yearly',
  currency: string,
  value: number,
  itemId: string,
  itemName: string
) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      const eventData: any = {
        event: 'begin_checkout',
        user_id: userId,
        plan_id: planId,
        plan_name: planName,
        billing_period: billingPeriod,
        ecommerce: {
          currency: currency,
          value: value,
          items: [
            {
              item_id: itemId,
              item_name: itemName,
              item_category: 'subscription',
              item_brand: 'chatl.ai',
              price: value,
              quantity: 1
            }
          ]
        }
      };
      
      window.dataLayer.push(eventData);
    } catch (error) {
      console.error('Error tracking begin_checkout:', error);
    }
  }
};

/**
 * Track purchase event
 * Fire on your success URL once you've validated that the Stripe session is paid / subscription active
 */
export const trackPurchase = async (
  userId: string,
  purchaseType: 'initial' | 'upgrade' | 'downgrade' | 'renewal',
  planId: string,
  planName: string,
  billingPeriod: 'monthly' | 'yearly',
  stripeSessionId: string,
  transactionId: string,
  currency: string,
  value: number,
  itemId: string,
  itemName: string
) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      const gclid = getCurrentGCLID();
      
      const eventData: any = {
        event: 'purchase',
        user_id: userId,
        event_source: 'web',
        purchase_type: purchaseType,
        plan_id: planId,
        plan_name: planName,
        billing_period: billingPeriod,
        stripe_mode: 'subscription',
        checkout_id: stripeSessionId,
        transaction_id: transactionId,
        ecommerce: {
          currency: currency,
          value: value,
          transaction_id: transactionId,
          items: [
            {
              item_id: itemId,
              item_name: itemName,
              item_category: 'subscription',
              item_brand: 'chatl.ai',
              price: value,
              quantity: 1
            }
          ]
        }
      };
      
      if (gclid) {
        eventData.gclid = gclid;
      }
      
      window.dataLayer.push(eventData);
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }
};

/**
 * Track purchase_fail event
 * Fire on cancel URL or when you detect a failed / canceled Stripe session
 */
export const trackPurchaseFail = async (
  userId: string,
  planId: string,
  planName: string,
  billingPeriod: 'monthly' | 'yearly',
  stripeSessionId: string,
  failureOrigin: 'web' | 'stripe' | 'bank',
  failureReason: string,
  currency: string,
  value: number,
  itemId: string,
  itemName: string
) => {
  await waitForGTM();
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      const eventData: any = {
        event: 'purchase_fail',
        user_id: userId,
        plan_id: planId,
        plan_name: planName,
        billing_period: billingPeriod,
        checkout_id: stripeSessionId,
        failure_origin: failureOrigin,
        failure_reason: failureReason,
        ecommerce: {
          currency: currency,
          value: value,
          items: [
            {
              item_id: itemId,
              item_name: itemName,
              item_category: 'subscription',
              item_brand: 'chatl.ai',
              price: value,
              quantity: 1
            }
          ]
        }
      };
      
      window.dataLayer.push(eventData);
    } catch (error) {
      console.error('Error tracking purchase_fail:', error);
    }
  }
};

// Legacy function names for backward compatibility
export const trackRegistrationComplete = trackSignUp;
export const trackPaymentComplete = trackPurchase;
