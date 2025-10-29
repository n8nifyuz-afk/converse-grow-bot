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

// Parse URL parameters
function getUrlParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.forEach((value, key) => {
    params[key] = value;
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
  const urlParams = getUrlParams();
  const { ip, country } = await getIPMetadata();
  
  // CRITICAL: Check localStorage for persisted GCLID (like AuthContext does)
  // Users may have signed up with ?gclid=ABC but current URL doesn't have it
  const gclidFromUrl = urlParams['gclid'] || null;
  const gclidFromStorage = typeof window !== 'undefined' ? localStorage.getItem('gclid') : null;
  const finalGclid = gclidFromUrl || gclidFromStorage || null;

  return {
    sessionId: getSessionId(),
    userIP: ip,
    countryCode: country,
    isMobile: isMobileDevice(),
    referer: document.referrer || null,
    urlParams,
    gclid: finalGclid,
  };
}
