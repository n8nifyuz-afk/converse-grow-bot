import { useEffect } from 'react';
import i18n from '@/i18n/config';
import { COUNTRY_TO_LANGUAGE } from '@/i18n/config';
import { getWebhookMetadata } from '@/utils/webhookMetadata';
import { supabase } from '@/integrations/supabase/client';

// Initialize language detection on app load
export function initLanguageDetection() {
  const detectAndSetLanguage = async () => {
    try {
      // First, check if user is logged in and has a saved language preference in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.language) {
        await i18n.changeLanguage(user.user_metadata.language);
        localStorage.setItem('i18nextLng', user.user_metadata.language);
        return; // User's saved preference takes highest priority
      }

      // Second, check localStorage for manually set language
      const savedLanguage = localStorage.getItem('i18nextLng');
      if (savedLanguage && savedLanguage !== 'undefined') {
        await i18n.changeLanguage(savedLanguage);
        return; // Local preference takes priority
      }

      // Finally, detect language from country/IP
      const metadata = await getWebhookMetadata();
      if (metadata.countryCode) {
        const detectedLanguage = COUNTRY_TO_LANGUAGE[metadata.countryCode];
        if (detectedLanguage && detectedLanguage !== i18n.language) {
          await i18n.changeLanguage(detectedLanguage);
          localStorage.setItem('i18nextLng', detectedLanguage);
        }
      }
    } catch (error) {
      console.warn('Failed to detect language:', error);
    }
  };

  detectAndSetLanguage();
}

// Hook version for components that need to trigger detection
export function useLanguageDetection() {
  useEffect(() => {
    initLanguageDetection();
  }, []);
}
