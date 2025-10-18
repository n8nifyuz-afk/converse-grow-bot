// Session and user metadata tracking utility

export interface SessionMetadata {
  sessionId: string;
  userIP: string;
  countryCode: string;
  isMobile: string;
  referer: string;
  urlParams: string;
  gclid: string;
}

// Get or create session ID
export const getSessionId = (): string => {
  const storageKey = 'user_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

// Detect if user is on mobile
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get URL parameters as object
export const getUrlParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

// Get GCLID from URL params
export const getGclid = (): string => {
  const params = new URLSearchParams(window.location.search);
  return params.get('gclid') || '';
};

// Get referer
export const getReferer = (): string => {
  return document.referrer || 'null';
};

// Fetch IP and country code from ipapi.co
let cachedMetadata: { ip: string; country: string } | null = null;

export const fetchIPAndCountry = async (): Promise<{ ip: string; country: string }> => {
  // Return cached data if available
  if (cachedMetadata) {
    return cachedMetadata;
  }
  
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    cachedMetadata = {
      ip: data.ip || 'unknown',
      country: data.country_code || 'unknown'
    };
    
    return cachedMetadata;
  } catch (error) {
    console.error('Error fetching IP and country:', error);
    return {
      ip: 'unknown',
      country: 'unknown'
    };
  }
};

// Get all session metadata
export const getSessionMetadata = async (): Promise<SessionMetadata> => {
  const { ip, country } = await fetchIPAndCountry();
  const urlParams = getUrlParams();
  
  return {
    sessionId: getSessionId(),
    userIP: ip,
    countryCode: country,
    isMobile: isMobileDevice() ? 'true' : 'false',
    referer: getReferer(),
    urlParams: JSON.stringify(urlParams),
    gclid: getGclid()
  };
};
