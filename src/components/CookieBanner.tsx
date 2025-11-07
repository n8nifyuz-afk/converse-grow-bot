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
    if (window.Cookiebot) {
      // Accept all cookies: necessary, preferences, statistics, marketing
      window.Cookiebot.submitCustomConsent(true, true, true, true);
      setShowBanner(false);
    }
  };

  const handleDeny = () => {
    if (window.Cookiebot) {
      // Only accept necessary cookies, deny all others
      window.Cookiebot.submitCustomConsent(true, false, false, false);
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg pointer-events-auto" 
      style={{ zIndex: 2147483647, pointerEvents: 'auto' }}
    >
      <div className="container mx-auto px-4 py-4 pointer-events-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-4 flex-1 pointer-events-none">
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
          <div className="flex gap-3 shrink-0 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
            <Button
              variant="outline"
              onClick={handleDeny}
              className="whitespace-nowrap pointer-events-auto cursor-pointer relative"
              style={{ pointerEvents: 'auto', zIndex: 2147483647 }}
            >
              Deny
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="whitespace-nowrap pointer-events-auto cursor-pointer relative"
              style={{ pointerEvents: 'auto', zIndex: 2147483647 }}
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
