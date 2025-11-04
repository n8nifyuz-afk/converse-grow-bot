import { supabase } from '@/integrations/supabase/client';
import { fetchIPAndCountry } from './webhookMetadata';
import { allCountries } from './countryPhoneCodes';

// Map country code to full country name
export function getCountryNameFromCode(code: string | null): string {
  if (!code) return 'Not available';
  
  const country = allCountries.find(c => c.code.toUpperCase() === code.toUpperCase());
  return country ? country.name : code; // Fallback to code if not found
}

// Detect and update missing country for authenticated users
export async function detectAndUpdateMissingCountry(userId: string): Promise<void> {
  try {
    // Check if user already has country
    const { data: profile } = await supabase
      .from('profiles')
      .select('country')
      .eq('user_id', userId)
      .single();
    
    // If country already exists, no need to update
    if (profile?.country) {
      return;
    }
    
    // Fetch country from IP
    const { country } = await fetchIPAndCountry();
    
    if (country) {
      // Update profile with detected country
      await supabase
        .from('profiles')
        .update({ country })
        .eq('user_id', userId);
      
      console.log('[Country Detection] Updated missing country:', country);
    }
  } catch (error) {
    console.error('[Country Detection] Failed to detect/update country:', error);
  }
}
