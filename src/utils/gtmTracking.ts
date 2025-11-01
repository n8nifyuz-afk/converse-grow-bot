// Google Tag Manager tracking utilities

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Initialize GTM with GCLID and URL parameters
 * This should be called on app initialization to ensure Google Ads can track conversions
 */
export const initializeGTMWithGCLID = () => {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return;
  }

  try {
    // Get GCLID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const gclidFromUrl = urlParams.get('gclid');
    const gclidFromStorage = localStorage.getItem('gclid');
    const gclid = gclidFromUrl || gclidFromStorage;

    // CRITICAL: Store GCLID in localStorage if found in URL (for later use during signup)
    if (gclidFromUrl && gclidFromUrl !== gclidFromStorage) {
      localStorage.setItem('gclid', gclidFromUrl);
    }

    // Collect all URL parameters for attribution
    const allUrlParams: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      allUrlParams[key] = value;
    });

    // CRITICAL: Store ALL URL parameters in localStorage (for later use during OAuth signup)
    // This ensures utm_source, utm_medium, gad_source, etc. persist through OAuth redirects
    if (Object.keys(allUrlParams).length > 0) {
      localStorage.setItem('url_params', JSON.stringify(allUrlParams));
    }

    // If we have GCLID or URL params, push to dataLayer
    if (gclid || Object.keys(allUrlParams).length > 0) {
      const eventData: Record<string, any> = {
        event: 'gtm_init',
      };

      if (gclid) {
        eventData.gclid = gclid;
      }

      if (Object.keys(allUrlParams).length > 0) {
        eventData.url_params = allUrlParams;
      }

      window.dataLayer.push(eventData);
    }
  } catch (error) {
    console.error('[GTM] Error initializing:', error);
  }
};

/**
 * Get current GCLID for event tracking
 */
const getCurrentGCLID = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const gclidFromUrl = urlParams.get('gclid');
  const gclidFromStorage = localStorage.getItem('gclid');
  
  return gclidFromUrl || gclidFromStorage;
};

export const trackRegistrationComplete = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = 'gtm_registration_tracked';
    const alreadyTracked = localStorage.getItem(trackedKey);
    
    if (alreadyTracked) {
      return;
    }
    
    const gclid = getCurrentGCLID();
    const eventData: Record<string, any> = {
      event: 'registration_complete'
    };
    
    if (gclid) {
      eventData.gclid = gclid;
    }
    
    window.dataLayer.push(eventData);
    localStorage.setItem(trackedKey, 'true');
  }
};

export const trackChatStart = (chatId?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = chatId ? `gtm_chat_start_${chatId}` : 'gtm_chat_start_temp';
    const trackedChats = sessionStorage.getItem('gtm_tracked_chats') || '';
    
    if (trackedChats.includes(trackedKey)) {
      return;
    }
    
    const gclid = getCurrentGCLID();
    const eventData: Record<string, any> = {
      event: 'chat_start'
    };
    
    if (gclid) {
      eventData.gclid = gclid;
    }
    
    window.dataLayer.push(eventData);
    
    const newTrackedChats = trackedChats ? `${trackedChats},${trackedKey}` : trackedKey;
    sessionStorage.setItem('gtm_tracked_chats', newTrackedChats);
  }
};

export const trackPaymentComplete = (
  planType: 'Pro' | 'Ultra',
  planDuration: 'monthly' | '3_months' | 'yearly',
  planPrice: number
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    const gclid = getCurrentGCLID();
    
    const eventData: Record<string, any> = {
      event: 'payment_complete',
      plan_type: planType,
      plan_duration: planDuration,
      plan_price: planPrice,
      currency: 'USD',
      value: planPrice
    };
    
    if (gclid) {
      eventData.gclid = gclid;
    }
    
    window.dataLayer.push(eventData);
  }
};
