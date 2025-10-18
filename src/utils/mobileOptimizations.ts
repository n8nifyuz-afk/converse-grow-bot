/**
 * Mobile-specific optimizations and utilities
 */

/**
 * Detect if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect if device is iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detect if device is Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

/**
 * Get viewport height accounting for mobile browser UI
 * Mobile browsers have dynamic UI that changes viewport height
 */
export const getViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;
  
  // Use visualViewport if available (most accurate on mobile)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  
  return window.innerHeight;
};

/**
 * Prevent zoom on input focus (iOS Safari)
 */
export const preventInputZoom = () => {
  if (!isIOS()) return;
  
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    );
  }
};

/**
 * Enable smooth scrolling for mobile
 */
export const enableSmoothScroll = () => {
  if (typeof document === 'undefined') return;
  
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // iOS momentum scrolling (vendor-specific)
  const bodyStyle = document.body.style as any;
  if ('webkitOverflowScrolling' in bodyStyle) {
    bodyStyle.webkitOverflowScrolling = 'touch';
  }
};

/**
 * Debounce scroll events for better performance
 */
export const createScrollHandler = (
  callback: () => void,
  delay: number = 100
): (() => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let ticking = false;

  return () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          callback();
          ticking = false;
        }, delay);
      });
      
      ticking = true;
    }
  };
};

/**
 * Optimize images for mobile bandwidth
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number = 800
): string => {
  // For Supabase storage URLs, you can add transformation parameters
  if (url.includes('supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=80`;
  }
  
  return url;
};

/**
 * Check if device has good network connection
 */
export const hasGoodConnection = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return true; // Assume good connection if API not available
  }

  const connection = (navigator as any).connection;
  
  // Check for slow connections (2G, slow-2g)
  if (connection.effectiveType) {
    return !['slow-2g', '2g'].includes(connection.effectiveType);
  }

  return true;
};

/**
 * Request persistent storage for PWA (prevents data eviction)
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return false;
  }

  try {
    if (navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    }
  } catch (error) {
    console.error('Failed to request persistent storage:', error);
  }

  return false;
};
