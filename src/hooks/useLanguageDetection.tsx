import { useEffect } from 'react';
import i18n from '@/i18n/config';
import { COUNTRY_TO_LANGUAGE } from '@/i18n/config';
import { getWebhookMetadata } from '@/utils/webhookMetadata';

// Initialize language detection on app load
export function initLanguageDetection() {
  const detectAndSetLanguage = async () => {
    // Check if user has manually set a language
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && savedLanguage !== 'undefined') {
      return; // User preference takes priority
    }

    try {
      // Get country from IP
      const metadata = await getWebhookMetadata();
      if (metadata.countryCode) {
        const detectedLanguage = COUNTRY_TO_LANGUAGE[metadata.countryCode];
        if (detectedLanguage && detectedLanguage !== i18n.language) {
          await i18n.changeLanguage(detectedLanguage);
        }
      }
    } catch (error) {
      console.warn('Failed to detect language from country:', error);
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
