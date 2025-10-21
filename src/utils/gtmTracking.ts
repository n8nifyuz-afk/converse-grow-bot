// Google Tag Manager tracking utilities

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const trackRegistrationComplete = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: 'registration_complete' });
    console.log('[GTM] Tracked: registration_complete');
  }
};

export const trackChatStart = () => {
  console.log('[GTM-DEBUG] trackChatStart called', {
    hasWindow: typeof window !== 'undefined',
    hasDataLayer: typeof window !== 'undefined' && !!window.dataLayer,
    dataLayerType: typeof window !== 'undefined' ? typeof window.dataLayer : 'N/A'
  });
  
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: 'chat_start' });
    console.log('[GTM] Tracked: chat_start');
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
