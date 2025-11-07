import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import logoLight from '@/assets/chatl-logo-black.png';
import logoDark from '@/assets/chatl-logo-white.png';

declare global {
  interface Window {
    Cookiebot?: {
      consent: {
        necessary: boolean;
        preferences: boolean;
        statistics: boolean;
        marketing: boolean;
      };
      consented: boolean;
      declined: boolean;
      show: () => void;
      hide: () => void;
      renew: () => void;
      submitCustomConsent: (
        necessary: boolean,
        preferences: boolean,
        statistics: boolean,
        marketing: boolean
      ) => void;
    };
  }
}

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Wait for Cookiebot to load
    const checkCookiebot = setInterval(() => {
      if (window.Cookiebot) {
        clearInterval(checkCookiebot);
        
        // Show banner if user hasn't consented or declined yet
        if (!window.Cookiebot.consented && !window.Cookiebot.declined) {
          setShowBanner(true);
        }
      }
    }, 100);

    return () => clearInterval(checkCookiebot);
  }, []);

  const handleAcceptAll = () => {
    console.log('🟢 [COOKIE-BANNER] Accept All clicked');
    if (window.Cookiebot) {
      console.log('✅ [COOKIE-BANNER] Cookiebot found, submitting consent');
      // Accept all cookies: necessary, preferences, statistics, marketing
      window.Cookiebot.submitCustomConsent(true, true, true, true);
      setShowBanner(false);
      console.log('✅ [COOKIE-BANNER] Banner hidden');
    } else {
      console.error('❌ [COOKIE-BANNER] Cookiebot not found');
    }
  };

  const handleDeny = () => {
    console.log('🔴 [COOKIE-BANNER] Deny clicked');
    if (window.Cookiebot) {
      console.log('✅ [COOKIE-BANNER] Cookiebot found, denying non-essential');
      // Only accept necessary cookies, deny all others
      window.Cookiebot.submitCustomConsent(true, false, false, false);
      setShowBanner(false);
      console.log('✅ [COOKIE-BANNER] Banner hidden');
    } else {
      console.error('❌ [COOKIE-BANNER] Cookiebot not found');
    }
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg z-[9999]"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <img 
              src={logoLight} 
              alt="ChatLearn" 
              className="h-6 w-auto hidden dark:hidden sm:block"
            />
            <img 
              src={logoDark} 
              alt="ChatLearn" 
              className="h-6 w-auto hidden dark:block"
            />
            <p className="text-sm text-foreground text-center sm:text-left">
              We use cookies to analyze site usage and measure conversions.
              Advertising and personalization cookies remain disabled unless you accept them.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleDeny}
              className="whitespace-nowrap"
            >
              Deny
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="whitespace-nowrap"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
