import { useEffect } from 'react';
import i18n from '@/i18n/config';
import { COUNTRY_TO_LANGUAGE } from '@/i18n/config';
import { getWebhookMetadata } from '@/utils/webhookMetadata';
import { supabase } from '@/integrations/supabase/client';

// Initialize language detection on app load
export function initLanguageDetection() {
  const detectAndSetLanguage = async () => {
    try {
      console.log('[Language Detection] Starting...');
      
      // First, check if user is logged in and has a saved language preference in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('[Language Detection] User logged in:', user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.language) {
          console.log('[Language Detection] Using database language:', profile.language);
          await i18n.changeLanguage(profile.language);
          localStorage.setItem('i18nextLng', profile.language);
          return; // User's saved preference takes highest priority
        }
      }

      // Second, check localStorage for manually set language (only if it's a valid language code)
      const savedLanguage = localStorage.getItem('i18nextLng');
      const validLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ar', 'ru'];
      
      if (savedLanguage && savedLanguage !== 'undefined' && savedLanguage !== 'null' && validLanguages.includes(savedLanguage)) {
        console.log('[Language Detection] Using localStorage language:', savedLanguage);
        await i18n.changeLanguage(savedLanguage);
        return; // Local preference takes priority
      }

      // Finally, detect language from country/IP (this works for both logged-in and non-logged-in users)
      console.log('[Language Detection] Detecting from IP...');
      const metadata = await getWebhookMetadata();
      console.log('[Language Detection] IP Metadata:', { countryCode: metadata.countryCode, userIP: metadata.userIP });
      
      if (metadata.countryCode) {
        const detectedLanguage = COUNTRY_TO_LANGUAGE[metadata.countryCode];
        console.log('[Language Detection] Detected language from country:', detectedLanguage, 'for country:', metadata.countryCode);
        
        if (detectedLanguage) {
          console.log('[Language Detection] Setting language to:', detectedLanguage);
          await i18n.changeLanguage(detectedLanguage);
          localStorage.setItem('i18nextLng', detectedLanguage);
        } else {
          console.log('[Language Detection] No language mapping for country:', metadata.countryCode);
        }
      } else {
        console.log('[Language Detection] No country code detected, using default language');
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
