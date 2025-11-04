import { useEffect } from 'react';
import i18n from '@/i18n/config';
import { COUNTRY_TO_LANGUAGE } from '@/i18n/config';
import { getWebhookMetadata } from '@/utils/webhookMetadata';
import { supabase } from '@/integrations/supabase/client';

// Initialize language detection on app load
export function initLanguageDetection() {
  const detectAndSetLanguage = async () => {
    try {
      // First, check if user is logged in and has a saved language preference in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.language) {
          await i18n.changeLanguage(profile.language);
          localStorage.setItem('i18nextLng', profile.language);
          return; // User's saved preference takes highest priority
        }
      }

      // Second, check if user has manually changed language (stored with a flag)
      const manuallySetLanguage = localStorage.getItem('i18nextLng');
      const isManuallySet = localStorage.getItem('i18nextLng_manual') === 'true';
      const validLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ar', 'ru'];
      
      if (isManuallySet && manuallySetLanguage && validLanguages.includes(manuallySetLanguage)) {
        await i18n.changeLanguage(manuallySetLanguage);
        return; // Manually set language takes priority
      }

      // Finally, detect language from country/IP (this works for both logged-in and non-logged-in users)
      const metadata = await getWebhookMetadata();
      
      if (metadata.countryCode) {
        const detectedLanguage = COUNTRY_TO_LANGUAGE[metadata.countryCode];
        
        if (detectedLanguage) {
          await i18n.changeLanguage(detectedLanguage);
          localStorage.setItem('i18nextLng', detectedLanguage);
          // Don't set manual flag - this is automatic detection
          localStorage.removeItem('i18nextLng_manual');
        }
      }
    } catch (error) {
      console.error('[Language Detection] Failed to detect language:', error);
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
