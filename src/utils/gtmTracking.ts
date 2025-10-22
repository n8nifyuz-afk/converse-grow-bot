// Google Tag Manager tracking utilities

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const trackRegistrationComplete = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // Check if already tracked to prevent duplicates
    const trackedKey = 'gtm_registration_tracked';
    if (localStorage.getItem(trackedKey)) {
      console.log('[GTM] registration_complete already tracked - skipping duplicate');
      return;
    }
    
    window.dataLayer.push({ event: 'registration_complete' });
    console.log('[GTM] Tracked: registration_complete');
    localStorage.setItem(trackedKey, 'true');
  }
};

export const trackChatStart = (chatId?: string) => {
  console.log('[GTM-DEBUG] trackChatStart called', {
    chatId,
    hasWindow: typeof window !== 'undefined',
    hasDataLayer: typeof window !== 'undefined' && !!window.dataLayer,
    dataLayerType: typeof window !== 'undefined' ? typeof window.dataLayer : 'N/A'
  });
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    // Use sessionStorage to prevent duplicate tracking within same session
    const trackedKey = chatId ? `gtm_chat_start_${chatId}` : 'gtm_chat_start_temp';
    const trackedChats = sessionStorage.getItem('gtm_tracked_chats') || '';
    
    if (trackedChats.includes(trackedKey)) {
      console.log('[GTM] chat_start already tracked for this chat - skipping duplicate', { chatId });
      return;
    }
    
    window.dataLayer.push({ event: 'chat_start' });
    console.log('[GTM] Tracked: chat_start', { chatId });
    
    // Store in sessionStorage (cleared when browser closes)
    const newTrackedChats = trackedChats ? `${trackedChats},${trackedKey}` : trackedKey;
    sessionStorage.setItem('gtm_tracked_chats', newTrackedChats);
  } else {
    console.error('[GTM] Failed to track chat_start - dataLayer not available');
  }
};

export const trackPaymentComplete = (
  planType: 'Pro' | 'Ultra',
  planDuration: 'monthly' | '3_months' | 'yearly',
  planPrice: number
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'payment_complete',
      plan_type: planType,
      plan_duration: planDuration,
      plan_price: planPrice,
    });
    console.log('[GTM] Tracked: payment_complete', { planType, planDuration, planPrice });
  }
};
