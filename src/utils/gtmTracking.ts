// Google Tag Manager tracking utilities

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const trackRegistrationComplete = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    const trackedKey = 'gtm_registration_tracked';
    if (localStorage.getItem(trackedKey)) {
      console.log('⏭️ Registration already tracked, skipping...');
      return;
    }
    
    console.log('🎯 Tracking registration to Google Analytics...');
    window.dataLayer.push({ event: 'registration_complete' });
    localStorage.setItem(trackedKey, 'true');
    console.log('✅ Registration tracked successfully');
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
    console.log('🎯 Pushing payment_complete event to GTM dataLayer...');
    window.dataLayer.push({
      event: 'payment_complete',
      plan_type: planType,
      plan_duration: planDuration,
      plan_price: planPrice,
    });
    console.log('✅ Payment event pushed to dataLayer:', {
      event: 'payment_complete',
      plan_type: planType,
      plan_duration: planDuration,
      plan_price: planPrice,
    });
  } else {
    console.error('❌ GTM dataLayer not available for payment tracking');
  }
};
