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
  } catch (error) {
    // Silent error
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
  } catch (error) {
    // Silent error
  }
};

/**
 * Initialize GTM with GCLID and URL parameters
 * This should be called on app initialization to ensure Google Ads can track conversions
 */
export const initializeGTMWithGCLID = () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 [GTM-INIT] Initializing GTM with GCLID tracking...');
  console.log('═══════════════════════════════════════════════════');
  
  if (typeof window === 'undefined' || !window.dataLayer) {
    console.error('❌ [GTM-INIT] Window or dataLayer not available!');
    console.log('💡 Make sure GTM script is loaded in index.html');
    return;
  }
  
  console.log('✅ [GTM-INIT] Window and dataLayer available');
  console.log('📊 [GTM-INIT] Current dataLayer length:', window.dataLayer.length);

  try {
    // Get GCLID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const gclidFromUrl = urlParams.get('gclid');
    const gclidFromStorage = localStorage.getItem('gclid');
    
    console.log('📍 [GTM] GCLID from URL:', gclidFromUrl || 'Not found');
    console.log('💾 [GTM] GCLID from storage:', gclidFromStorage || 'Not found');
    
    // Check if stored GCLID has expired
    const hasExpiredGCLID = gclidFromStorage && isGCLIDExpired();
    if (hasExpiredGCLID) {
      console.log('⏰ [GTM] Stored GCLID expired, clearing...');
      clearTrackingData();
    }
    
    const gclid = gclidFromUrl || (hasExpiredGCLID ? null : gclidFromStorage);

    // CRITICAL: Store GCLID with timestamp if found in URL
    // Only store if not already present (preserves original tracking)
    if (gclidFromUrl && !gclidFromStorage) {
      console.log('💾 [GTM] Storing new GCLID:', gclidFromUrl);
      localStorage.setItem('gclid', gclidFromUrl);
      localStorage.setItem('gclid_timestamp', Date.now().toString());
    } else if (gclid) {
      console.log('✅ [GTM] Using existing GCLID:', gclid);
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
        console.log('✅ [GTM-INIT] Adding GCLID to event:', gclid);
      }

      if (Object.keys(allUrlParams).length > 0) {
        eventData.url_params = allUrlParams;
        console.log('✅ [GTM-INIT] Adding URL params:', allUrlParams);
      }

      console.log('═══════════════════════════════════════════════════');
      console.log('📤 [GTM-INIT] Pushing gtm_init event to dataLayer:');
      console.log(JSON.stringify(eventData, null, 2));
      console.log('═══════════════════════════════════════════════════');
      
      window.dataLayer.push(eventData);
      
      console.log('✅ [GTM-INIT] Event pushed successfully!');
      console.log('📊 [GTM-INIT] Full dataLayer:', window.dataLayer);
      console.log('═══════════════════════════════════════════════════');
    } else {
      console.log('ℹ️ [GTM-INIT] No tracking data to push (no GCLID or URL params)');
      console.log('═══════════════════════════════════════════════════');
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

/**
 * Wait for GTM to be ready before firing events
 */
const waitForGTM = (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if GTM is already loaded
    if (typeof window !== 'undefined' && window.dataLayer) {
      const gtmLoaded = window.dataLayer.some((item: any) => 
        item.event === 'gtm.js' || item.event === 'gtm.load'
      );
      
      if (gtmLoaded) {
        console.log('✅ [GTM-READY] GTM already loaded');
        resolve();
        return;
      }
    }
    
    // Wait for GTM to load (max 3 seconds)
    console.log('⏳ [GTM-READY] Waiting for GTM to load...');
    const maxWait = 3000;
    const checkInterval = 100;
    let elapsed = 0;
    
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.dataLayer) {
        const gtmLoaded = window.dataLayer.some((item: any) => 
          item.event === 'gtm.js' || item.event === 'gtm.load'
        );
        
        if (gtmLoaded) {
          console.log('✅ [GTM-READY] GTM loaded after', elapsed, 'ms');
          clearInterval(interval);
          resolve();
          return;
        }
      }
      
      elapsed += checkInterval;
      if (elapsed >= maxWait) {
        console.warn('⚠️ [GTM-READY] GTM not loaded after', maxWait, 'ms, proceeding anyway');
        clearInterval(interval);
        resolve();
      }
    }, checkInterval);
  });
};

export const trackRegistrationComplete = async () => {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 [GTM-REGISTRATION] trackRegistrationComplete() called');
    console.log('═══════════════════════════════════════════════════');
    
    if (typeof window !== 'undefined' && window.dataLayer) {
      console.log('✅ [GTM-REGISTRATION] dataLayer is available');
      
      // Wait for GTM to be ready
      await waitForGTM();
      
      const gclid = getCurrentGCLID();
      console.log('📍 [GTM-REGISTRATION] Current GCLID:', gclid || 'None');
      
      // Get URL params
      const urlParamsStr = localStorage.getItem('url_params');
      let urlParams = {};
      if (urlParamsStr) {
        try {
          urlParams = JSON.parse(urlParamsStr);
          console.log('📍 [GTM-REGISTRATION] Stored URL params:', urlParams);
        } catch (e) {
          console.error('❌ [GTM-REGISTRATION] Error parsing URL params');
        }
      }
      
      const eventData: Record<string, any> = {
        event: 'registration_complete'
      };
      
      if (gclid) {
        eventData.gclid = gclid;
        console.log('✅ [GTM-REGISTRATION] Adding GCLID to event');
      }
      
      console.log('═══════════════════════════════════════════════════');
      console.log('📤 [GTM-REGISTRATION] Pushing event to dataLayer:');
      console.log(JSON.stringify(eventData, null, 2));
      console.log('═══════════════════════════════════════════════════');
      
      window.dataLayer.push(eventData);
      
      console.log('✅ [GTM-REGISTRATION] Event pushed successfully!');
      console.log('📊 [GTM-REGISTRATION] Full dataLayer:', window.dataLayer);
      console.log('═══════════════════════════════════════════════════');
    } else {
      console.error('❌ [GTM-REGISTRATION] Window or dataLayer not available!');
      console.log('═══════════════════════════════════════════════════');
    }
  } catch (error) {
    console.error('❌ [GTM-REGISTRATION] Fatal error in trackRegistrationComplete:', error);
  }
};

export const trackChatStart = (chatId?: string) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🎯 [GTM-CHAT] Tracking chat_start event');
  console.log('💬 [GTM-CHAT] Chat ID:', chatId || 'None');
  console.log('═══════════════════════════════════════════════════');
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = chatId ? `gtm_chat_start_${chatId}` : 'gtm_chat_start_temp';
    const trackedChats = sessionStorage.getItem('gtm_tracked_chats') || '';
    
    if (trackedChats.includes(trackedKey)) {
      console.log('⏭️ [GTM-CHAT] Chat start already tracked, skipping');
      console.log('📝 [GTM-CHAT] Tracked chats:', trackedChats);
      console.log('═══════════════════════════════════════════════════');
      return;
    }
    
    const gclid = getCurrentGCLID();
    console.log('📍 [GTM-CHAT] Current GCLID:', gclid || 'None');
    
    // Get URL params
    const urlParamsStr = localStorage.getItem('url_params');
    let urlParams = {};
    if (urlParamsStr) {
      try {
        urlParams = JSON.parse(urlParamsStr);
        console.log('📍 [GTM-CHAT] Stored URL params:', urlParams);
      } catch (e) {
        console.error('❌ [GTM-CHAT] Error parsing URL params');
      }
    }
    
    const eventData: Record<string, any> = {
      event: 'chat_start'
    };
    
    if (gclid) {
      eventData.gclid = gclid;
      console.log('✅ [GTM-CHAT] Adding GCLID to event');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('📤 [GTM-CHAT] Pushing event to dataLayer:');
    console.log(JSON.stringify(eventData, null, 2));
    console.log('═══════════════════════════════════════════════════');
    
    window.dataLayer.push(eventData);
    
    const newTrackedChats = trackedChats ? `${trackedChats},${trackedKey}` : trackedKey;
    sessionStorage.setItem('gtm_tracked_chats', newTrackedChats);
    
    console.log('✅ [GTM-CHAT] Event pushed successfully!');
    console.log('📊 [GTM-CHAT] Full dataLayer:', window.dataLayer);
    console.log('═══════════════════════════════════════════════════');
  } else {
    console.error('❌ [GTM-CHAT] Window or dataLayer not available!');
    console.log('═══════════════════════════════════════════════════');
  }
};

export const trackPaymentComplete = (
  planType: 'Pro' | 'Ultra',
  planDuration: 'monthly' | '3_months' | 'yearly',
  planPrice: number
) => {
  console.log('🎯 [GTM] Tracking payment_complete event');
  console.log('💰 [GTM] Plan details:', { planType, planDuration, planPrice });
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    const gclid = getCurrentGCLID();
    console.log('📍 [GTM] Current GCLID:', gclid || 'None');
    
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
    
    console.log('📤 [GTM] Pushing event:', eventData);
    window.dataLayer.push(eventData);
    console.log('✅ [GTM] Payment event tracked successfully');
    
    // Clear tracking data after successful payment conversion
    setTimeout(() => {
      console.log('🧹 [GTM] Clearing tracking data after conversion');
      clearTrackingDataAfterConversion();
    }, 1000); // Small delay to ensure GTM processes the event
  } else {
    console.warn('⚠️ [GTM] Window or dataLayer not available');
  }
};
