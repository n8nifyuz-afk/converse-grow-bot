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
  console.log('═══════════════════════════════════════════════');
  console.log('🎯 [GTM] initializeGTMWithGCLID() CALLED');
  console.log('═══════════════════════════════════════════════');
  
  if (typeof window === 'undefined' || !window.dataLayer) {
    console.error('❌ [GTM-INIT] GTM dataLayer not available for GCLID initialization!', {
      windowAvailable: typeof window !== 'undefined',
      dataLayerAvailable: typeof window !== 'undefined' && !!window.dataLayer
    });
    console.log('═══════════════════════════════════════════════');
    return;
  }

  try {
    // Get GCLID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const gclidFromUrl = urlParams.get('gclid');
    const gclidFromStorage = localStorage.getItem('gclid');
    const gclid = gclidFromUrl || gclidFromStorage;

    console.log('📊 [GTM-INIT] GCLID Status:', {
      currentUrl: window.location.href,
      gclidFromUrl: gclidFromUrl || 'NOT_IN_URL',
      gclidFromStorage: gclidFromStorage || 'NOT_IN_STORAGE',
      finalGclid: gclid || 'NO_GCLID_FOUND'
    });

    // CRITICAL: Store GCLID in localStorage if found in URL (for later use during signup)
    if (gclidFromUrl && gclidFromUrl !== gclidFromStorage) {
      localStorage.setItem('gclid', gclidFromUrl);
      console.log('💾 [GTM-INIT] GCLID saved to localStorage:', gclidFromUrl);
    }

    // Collect all URL parameters for attribution
    const allUrlParams: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      allUrlParams[key] = value;
    });

    console.log('📊 [GTM-INIT] URL Parameters:', allUrlParams);

    // If we have GCLID or URL params, push to dataLayer
    if (gclid || Object.keys(allUrlParams).length > 0) {
      const eventData: Record<string, any> = {
        event: 'gtm_init',
      };

      if (gclid) {
        eventData.gclid = gclid;
        console.log('🎯 [GTM-INIT] Adding GCLID to event:', gclid);
      }

      if (Object.keys(allUrlParams).length > 0) {
        eventData.url_params = allUrlParams;
        console.log('🎯 [GTM-INIT] Adding URL params to event:', allUrlParams);
      }

      console.log('📤 [GTM-INIT] Pushing to dataLayer:', eventData);
      console.log('📊 [GTM-INIT] dataLayer BEFORE push:', JSON.stringify(window.dataLayer, null, 2));
      
      window.dataLayer.push(eventData);
      
      console.log('📊 [GTM-INIT] dataLayer AFTER push:', JSON.stringify(window.dataLayer, null, 2));
      console.log('✅ [GTM-INIT] GTM initialized successfully!');
    } else {
      console.log('ℹ️ [GTM-INIT] No GCLID or URL params found - skipping GTM init event');
    }
    console.log('═══════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ [GTM-INIT] Error initializing GTM with GCLID:', error);
    console.log('═══════════════════════════════════════════════');
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
  console.log('═══════════════════════════════════════════════');
  console.log('🎯 [GTM] trackRegistrationComplete() CALLED');
  console.log('═══════════════════════════════════════════════');
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = 'gtm_registration_tracked';
    const alreadyTracked = localStorage.getItem(trackedKey);
    
    console.log('📊 [GTM-REG] Check status:', {
      windowAvailable: !!window,
      dataLayerAvailable: !!window.dataLayer,
      dataLayerLength: window.dataLayer?.length || 0,
      alreadyTracked: !!alreadyTracked,
      trackedValue: alreadyTracked
    });
    
    if (alreadyTracked) {
      console.log('⏭️ [GTM-REG] Registration already tracked, skipping...');
      console.log('═══════════════════════════════════════════════');
      return;
    }
    
    const gclid = getCurrentGCLID();
    const eventData: Record<string, any> = {
      event: 'registration_complete'
    };
    
    if (gclid) {
      eventData.gclid = gclid;
      console.log('🎯 [GTM-REG] Including GCLID:', gclid);
    } else {
      console.log('⚠️ [GTM-REG] No GCLID found');
    }
    
    console.log('📤 [GTM-REG] Pushing to dataLayer:', eventData);
    console.log('📊 [GTM-REG] dataLayer BEFORE push:', JSON.stringify(window.dataLayer, null, 2));
    
    window.dataLayer.push(eventData);
    
    console.log('📊 [GTM-REG] dataLayer AFTER push:', JSON.stringify(window.dataLayer, null, 2));
    
    localStorage.setItem(trackedKey, 'true');
    console.log('✅ [GTM-REG] Registration tracked successfully!');
    console.log('═══════════════════════════════════════════════');
  } else {
    console.error('❌ [GTM-REG] GTM dataLayer not available!', {
      windowAvailable: typeof window !== 'undefined',
      dataLayerAvailable: typeof window !== 'undefined' && !!window.dataLayer
    });
    console.log('═══════════════════════════════════════════════');
  }
};

export const trackChatStart = (chatId?: string) => {
  console.log('═══════════════════════════════════════════════');
  console.log('🎯 [GTM] trackChatStart() CALLED with chatId:', chatId);
  console.log('═══════════════════════════════════════════════');
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = chatId ? `gtm_chat_start_${chatId}` : 'gtm_chat_start_temp';
    const trackedChats = sessionStorage.getItem('gtm_tracked_chats') || '';
    
    console.log('📊 [GTM-CHAT] Check status:', {
      chatId,
      trackedKey,
      trackedChats,
      alreadyTracked: trackedChats.includes(trackedKey),
      windowAvailable: !!window,
      dataLayerAvailable: !!window.dataLayer,
      dataLayerLength: window.dataLayer?.length || 0
    });
    
    if (trackedChats.includes(trackedKey)) {
      console.log('⏭️ [GTM-CHAT] Chat already tracked, skipping...');
      console.log('═══════════════════════════════════════════════');
      return;
    }
    
    const gclid = getCurrentGCLID();
    const eventData: Record<string, any> = {
      event: 'chat_start'
    };
    
    if (gclid) {
      eventData.gclid = gclid;
      console.log('🎯 [GTM-CHAT] Including GCLID:', gclid);
    } else {
      console.log('⚠️ [GTM-CHAT] No GCLID found');
    }
    
    console.log('📤 [GTM-CHAT] Pushing to dataLayer:', eventData);
    console.log('📊 [GTM-CHAT] dataLayer BEFORE push:', JSON.stringify(window.dataLayer, null, 2));
    
    window.dataLayer.push(eventData);
    
    console.log('📊 [GTM-CHAT] dataLayer AFTER push:', JSON.stringify(window.dataLayer, null, 2));
    
    const newTrackedChats = trackedChats ? `${trackedChats},${trackedKey}` : trackedKey;
    sessionStorage.setItem('gtm_tracked_chats', newTrackedChats);
    
    console.log('✅ [GTM-CHAT] Chat start tracked successfully!');
    console.log('═══════════════════════════════════════════════');
  } else {
    console.error('❌ [GTM-CHAT] GTM dataLayer not available!', {
      windowAvailable: typeof window !== 'undefined',
      dataLayerAvailable: typeof window !== 'undefined' && !!window.dataLayer
    });
    console.log('═══════════════════════════════════════════════');
  }
};

export const trackPaymentComplete = (
  planType: 'Pro' | 'Ultra',
  planDuration: 'monthly' | '3_months' | 'yearly',
  planPrice: number
) => {
  console.log('═══════════════════════════════════════════════');
  console.log('🎯 [GTM] trackPaymentComplete() CALLED');
  console.log('═══════════════════════════════════════════════');
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    const gclid = getCurrentGCLID();
    
    console.log('📊 [GTM-PAY] Payment details:', {
      planType,
      planDuration,
      planPrice,
      gclid: gclid || 'NOT_FOUND',
      windowAvailable: !!window,
      dataLayerAvailable: !!window.dataLayer,
      dataLayerLength: window.dataLayer?.length || 0
    });
    
    const eventData: Record<string, any> = {
      event: 'payment_complete',
      plan_type: planType,
      plan_duration: planDuration,
      plan_price: planPrice,
      currency: 'USD',
      value: planPrice  // Standard ecommerce field for conversion value
    };
    
    if (gclid) {
      eventData.gclid = gclid;
      console.log('🎯 [GTM-PAY] Including GCLID:', gclid);
    } else {
      console.log('⚠️ [GTM-PAY] No GCLID found - payment will be tracked without GCLID');
    }
    
    console.log('📤 [GTM-PAY] Pushing to dataLayer:', eventData);
    console.log('📊 [GTM-PAY] dataLayer BEFORE push:', JSON.stringify(window.dataLayer, null, 2));
    
    window.dataLayer.push(eventData);
    
    console.log('📊 [GTM-PAY] dataLayer AFTER push:', JSON.stringify(window.dataLayer, null, 2));
    console.log('✅ [GTM-PAY] Payment event pushed successfully!');
    console.log('═══════════════════════════════════════════════');
  } else {
    console.error('❌ [GTM-PAY] GTM dataLayer not available for payment tracking!', {
      windowAvailable: typeof window !== 'undefined',
      dataLayerAvailable: typeof window !== 'undefined' && !!window.dataLayer
    });
    console.log('═══════════════════════════════════════════════');
  }
};
