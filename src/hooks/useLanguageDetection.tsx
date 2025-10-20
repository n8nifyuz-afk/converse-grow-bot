import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_TO_LANGUAGE } from '@/i18n/config';
import { getWebhookMetadata } from '@/utils/webhookMetadata';

export function useLanguageDetection() {
  const { i18n } = useTranslation();

  useEffect(() => {
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
  }, [i18n]);
}
