// Comprehensive browser and device tracking utilities

export interface BrowserInfo {
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  screenResolution: string;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  touchSupport: boolean;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
}

export interface ActivityLogData {
  activityType: string;
  browserInfo: BrowserInfo;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  country?: string;
  referrer: string;
}

// Parse user agent to get browser details
function parseBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let osVersion = 'Unknown';
  let device = 'Unknown';
  
  // Detect browser
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edg/')) {
    browser = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  
  // Detect OS
  if (ua.includes('Windows NT')) {
    os = 'Windows';
    const version = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    const versionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    osVersion = version ? (versionMap[version] || version) : 'Unknown';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
  } else if (ua.includes('Android')) {
    os = 'Android';
    osVersion = ua.match(/Android (\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = ua.includes('iPad') ? 'iPadOS' : 'iOS';
    osVersion = ua.match(/OS (\d+_\d+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }
  
  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  if (isTablet) {
    device = 'Tablet';
  } else if (isMobile) {
    device = 'Mobile';
  } else {
    device = 'Desktop';
  }
  
  return {
    userAgent: ua,
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    isMobile,
    isTablet,
    isDesktop,
  };
}

// Collect comprehensive device information
function getDeviceInfo(): DeviceInfo {
  const nav = navigator as any;
  
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    colorDepth: screen.colorDepth,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    language: navigator.language,
    languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || null,
  };
}

// Get all tracking data
export function getFullTrackingData(activityType: string = 'page_view'): Omit<ActivityLogData, 'ipAddress' | 'country'> {
  return {
    activityType,
    browserInfo: parseBrowserInfo(),
    deviceInfo: getDeviceInfo(),
    referrer: document.referrer || '',
  };
}

// Log activity to Supabase via edge function
export async function logUserActivity(
  userId: string | null,
  activityType: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const trackingData = getFullTrackingData(activityType);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://lciaiunzacgvvbvcshdh.supabase.co'}/functions/v1/log-user-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjaWFpdW56YWNndnZidmNzaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzc3NjQsImV4cCI6MjA3MzI1Mzc2NH0.zpQgi6gkTSfP-znoV6u_YiyzKRp8fklxrz_xszGtPLI'}`
      },
      body: JSON.stringify({
        userId,
        ...trackingData,
        metadata,
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to log activity');
    }
  } catch (error) {
    console.warn('Failed to log user activity:', error);
  }
}
