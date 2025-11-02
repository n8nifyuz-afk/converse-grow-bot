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
  const currentUrlParams = getUrlParams();
  const { ip, country } = await getIPMetadata();
  
  // CRITICAL: For logged-in users, fetch stored params from database
  // This ensures we send the ORIGINAL signup params, not just current URL
  let finalUrlParams = currentUrlParams;
  let finalGclid = currentUrlParams['gclid'] || null;
  let finalReferer = document.referrer || null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is logged in - fetch stored params from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gclid, url_params, initial_referer')
        .eq('user_id', user.id)
        .single();
      
      if (!error && profile) {
        // Use stored params from database (fallback to current URL if not stored)
        finalGclid = profile.gclid || finalGclid;
        
        // Safely cast url_params from Json to Record<string, string>
        if (profile.url_params && typeof profile.url_params === 'object' && !Array.isArray(profile.url_params)) {
          const storedParams = profile.url_params as Record<string, string>;
          if (Object.keys(storedParams).length > 0) {
            finalUrlParams = storedParams;
          }
        }
        
        finalReferer = profile.initial_referer || finalReferer;
      }
    }
  } catch (error) {
    // Silently fail - use fallback values
  }
  
  // Fallback to localStorage for gclid if not in database or URL
  if (!finalGclid && typeof window !== 'undefined') {
    finalGclid = localStorage.getItem('gclid') || null;
  }

  return {
    sessionId: getSessionId(),
    userIP: ip,
    countryCode: country,
    isMobile: isMobileDevice(),
    referer: finalReferer,
    urlParams: finalUrlParams,
    gclid: finalGclid,
  };
}
