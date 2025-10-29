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
    console.warn('⚠️ GTM dataLayer not available for GCLID initialization');
    return;
  }

  try {
    // Get GCLID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const gclidFromUrl = urlParams.get('gclid');
    const gclidFromStorage = localStorage.getItem('gclid');
    const gclid = gclidFromUrl || gclidFromStorage;

    // Collect all URL parameters for attribution
    const allUrlParams: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      allUrlParams[key] = value;
    });

    // If we have GCLID or URL params, push to dataLayer
    if (gclid || Object.keys(allUrlParams).length > 0) {
      const eventData: Record<string, any> = {
        event: 'gtm_init',
      };

      if (gclid) {
        eventData.gclid = gclid;
        console.log('🎯 Pushing GCLID to GTM dataLayer:', gclid);
      }

      if (Object.keys(allUrlParams).length > 0) {
        eventData.url_params = allUrlParams;
        console.log('🎯 Pushing URL params to GTM dataLayer:', allUrlParams);
      }

      window.dataLayer.push(eventData);
      console.log('✅ GTM initialized with tracking parameters');
    }
  } catch (error) {
    console.error('❌ Error initializing GTM with GCLID:', error);
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
    if (localStorage.getItem(trackedKey)) {
      console.log('⏭️ Registration already tracked, skipping...');
      return;
    }
    
    const gclid = getCurrentGCLID();
    const eventData: Record<string, any> = { 
      event: 'registration_complete'
    };
    
    if (gclid) {
      eventData.gclid = gclid;
      console.log('🎯 Including GCLID in registration event:', gclid);
    }
    
    console.log('🎯 Tracking registration to Google Analytics...');
    window.dataLayer.push(eventData);
    localStorage.setItem(trackedKey, 'true');
    console.log('✅ Registration tracked successfully with data:', eventData);
  } else {
    console.warn('⚠️ GTM dataLayer not available for registration tracking');
  }
};

export const trackChatStart = (chatId?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = chatId ? `gtm_chat_start_${chatId}` : 'gtm_chat_start_temp';
    const trackedChats = sessionStorage.getItem('gtm_tracked_chats') || '';
    
    if (trackedChats.includes(trackedKey)) {
      return;
    }
    
    window.dataLayer.push({ event: 'chat_start' });
    
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
      currency: 'USD', // Add currency for Google Ads conversion value
      value: planPrice, // Standard ecommerce field
    };
    
    if (gclid) {
      eventData.gclid = gclid;
      console.log('🎯 Including GCLID in payment event:', gclid);
    }
    
    console.log('🎯 Pushing payment_complete event to GTM dataLayer...');
    window.dataLayer.push(eventData);
    console.log('✅ Payment event pushed to dataLayer:', eventData);
  } else {
    console.error('❌ GTM dataLayer not available for payment tracking');
  }
};
