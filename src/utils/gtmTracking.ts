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
    localStorage.removeItem('gclid_timestamp');
    localStorage.removeItem('url_params');
    localStorage.removeItem('url_params_timestamp');
    console.log('🧹 [GTM] Tracking data cleared');
  } catch (error) {
    console.error('❌ [GTM] Error clearing tracking data:', error);
  }
};

/**
 * Clear tracking data after successful conversion
 * Call this after signup/payment is tracked
 */
export const clearTrackingDataAfterConversion = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('gclid');
    localStorage.removeItem('gclid_timestamp');
    localStorage.removeItem('url_params');
    localStorage.removeItem('url_params_timestamp');
    console.log('✅ [GTM] Tracking data cleared after conversion');
  } catch (error) {
    console.error('❌ [GTM] Error clearing tracking data:', error);
  }
};

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
    
    // Check if stored GCLID has expired
    const hasExpiredGCLID = gclidFromStorage && isGCLIDExpired();
    if (hasExpiredGCLID) {
      console.log('⏰ [GTM] GCLID expired (>90 days), clearing...');
      clearTrackingData();
    }
    
    const gclid = gclidFromUrl || (hasExpiredGCLID ? null : gclidFromStorage);

    // CRITICAL: Store GCLID with timestamp if found in URL
    // Only store if not already present (preserves original tracking)
    if (gclidFromUrl && !gclidFromStorage) {
      localStorage.setItem('gclid', gclidFromUrl);
      localStorage.setItem('gclid_timestamp', Date.now().toString());
      console.log('💾 [GTM] New GCLID stored with 90-day expiry');
    }

    // Collect all URL parameters for attribution
    const allUrlParams: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      // Skip internal/system parameters that shouldn't be tracked
      if (!key.startsWith('__') && key !== 'code' && key !== 'state') {
        allUrlParams[key] = value;
      }
    });

    // CRITICAL: MERGE new URL parameters with existing ones (never overwrite)
    // This ensures utm_source, utm_medium, gad_source, etc. persist through OAuth redirects
    const existingParamsStr = localStorage.getItem('url_params');
    let mergedParams = allUrlParams;
    
    if (existingParamsStr) {
      try {
        const existingParams = JSON.parse(existingParamsStr);
        // Merge: keep existing params, only add new ones if they don't exist
        mergedParams = { ...allUrlParams, ...existingParams };
      } catch (e) {
        // Silent error - continue with current params
      }
    }

    // Only save if we have tracking parameters (not just system parameters)
    if (Object.keys(mergedParams).length > 0) {
      localStorage.setItem('url_params', JSON.stringify(mergedParams));
      localStorage.setItem('url_params_timestamp', Date.now().toString());
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
    console.error('❌ [GTM] Error initializing:', error);
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
    
    // Clear tracking data after successful conversion
    setTimeout(() => {
      clearTrackingDataAfterConversion();
    }, 1000); // Small delay to ensure GTM processes the event
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
    
    // Clear tracking data after successful payment conversion
    setTimeout(() => {
      clearTrackingDataAfterConversion();
    }, 1000); // Small delay to ensure GTM processes the event
  }
};
