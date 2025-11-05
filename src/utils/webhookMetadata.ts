import { supabase } from "@/integrations/supabase/client";

// Utility to gather metadata for webhook calls
export interface WebhookMetadata {
  sessionId: string;
  userIP: string | null;
  countryCode: string | null;
  isMobile: boolean;
  referer: string | null;
  urlParams: Record<string, string>;
  gclid: string | null;
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
}

// Parse URL parameters (filter out auth error params)
function getUrlParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  const errorKeys = ['error', 'error_code', 'error_description', 'error_subcode'];
  
  searchParams.forEach((value, key) => {
    // Skip error parameters from OAuth/auth flows
    if (!errorKeys.includes(key)) {
      params[key] = value;
    }
  });
  return params;
}

// Detect if mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get IP and country (cached for session)
let cachedMetadata: { ip: string | null; country: string | null } | null = null;

async function getIPMetadata(): Promise<{ ip: string | null; country: string | null }> {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  try {
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    if (response.ok) {
      const text = await response.text();
      const data = Object.fromEntries(
        text.trim().split('\n').map(line => line.split('='))
      );
      cachedMetadata = {
        ip: data.ip || null,
        country: data.loc || null,
      };
      return cachedMetadata;
    }
  } catch (error) {
    console.warn('Failed to fetch IP metadata:', error);
  }

  cachedMetadata = { ip: null, country: null };
  return cachedMetadata;
}

// Export IP metadata fetching for use in auth flows
export async function fetchIPAndCountry(): Promise<{ ip: string | null; country: string | null }> {
  return await getIPMetadata();
}

// Main function to gather all metadata
export async function getWebhookMetadata(): Promise<WebhookMetadata> {
  console.log('═══════════════════════════════════════════════════');
  console.log('📡 [CAMPAIGN-TRACKING] Gathering webhook metadata...');
  console.log('═══════════════════════════════════════════════════');
  
  const currentUrlParams = getUrlParams();
  console.log('🔍 [CAMPAIGN-TRACKING] Current URL params:', currentUrlParams);
  
  const { ip, country } = await getIPMetadata();
  console.log('🌍 [CAMPAIGN-TRACKING] IP:', ip, 'Country:', country);
  
  // CRITICAL: For logged-in users, fetch stored params from database
  // This ensures we send the ORIGINAL signup params, not just current URL
  let finalUrlParams = currentUrlParams;
  let finalGclid = currentUrlParams['gclid'] || null;
  let finalReferer = document.referrer || null;
  
  console.log('📍 [CAMPAIGN-TRACKING] Initial values:');
  console.log('  - GCLID from URL:', finalGclid);
  console.log('  - Referer:', finalReferer);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('👤 [CAMPAIGN-TRACKING] User logged in:', user.id);
      console.log('🔍 [CAMPAIGN-TRACKING] Fetching stored campaign data from database...');
      
      // User is logged in - fetch stored params from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gclid, url_params, initial_referer')
        .eq('user_id', user.id)
        .single();
      
      if (!error && profile) {
        console.log('✅ [CAMPAIGN-TRACKING] Database profile found!');
        console.log('📊 [CAMPAIGN-TRACKING] Stored campaign data:', {
          gclid: profile.gclid,
          url_params: profile.url_params,
          initial_referer: profile.initial_referer
        });
        
        // Use stored params from database (fallback to current URL if not stored)
        finalGclid = profile.gclid || finalGclid;
        console.log('🎯 [CAMPAIGN-TRACKING] Final GCLID:', finalGclid, profile.gclid ? '(from DB)' : '(from URL/localStorage)');
        
        // Safely cast url_params from Json to Record<string, string>
        if (profile.url_params && typeof profile.url_params === 'object' && !Array.isArray(profile.url_params)) {
          const storedParams = profile.url_params as Record<string, string>;
          if (Object.keys(storedParams).length > 0) {
            finalUrlParams = storedParams;
            console.log('✅ [CAMPAIGN-TRACKING] Using stored URL params from DB:', storedParams);
          }
        }
        
        finalReferer = profile.initial_referer || finalReferer;
        console.log('🔗 [CAMPAIGN-TRACKING] Final referer:', finalReferer, profile.initial_referer ? '(from DB)' : '(from current)');
      } else {
        console.warn('⚠️ [CAMPAIGN-TRACKING] No profile found in database or error:', error);
      }
    } else {
      console.log('👥 [CAMPAIGN-TRACKING] User not logged in, using current URL data');
    }
  } catch (error) {
    console.error('❌ [CAMPAIGN-TRACKING] Error fetching profile:', error);
  }
  
  // Fallback to localStorage for gclid if not in database or URL
  if (!finalGclid && typeof window !== 'undefined') {
    const storedGclid = localStorage.getItem('gclid');
    if (storedGclid) {
      finalGclid = storedGclid;
      console.log('💾 [CAMPAIGN-TRACKING] Using GCLID from localStorage:', storedGclid);
    }
  }
  
  const metadata = {
    sessionId: getSessionId(),
    userIP: ip,
    countryCode: country,
    isMobile: isMobileDevice(),
    referer: finalReferer,
    urlParams: finalUrlParams,
    gclid: finalGclid,
  };
  
  console.log('═══════════════════════════════════════════════════');
  console.log('📤 [CAMPAIGN-TRACKING] Final webhook metadata:');
  console.log(JSON.stringify(metadata, null, 2));
  console.log('═══════════════════════════════════════════════════');

  return metadata;
}
