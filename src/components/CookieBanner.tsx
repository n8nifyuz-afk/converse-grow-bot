import { useState, useEffect } from 'react';
import { X, Settings, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import logoLight from '@/assets/chatl-logo-black.png';
import logoDark from '@/assets/chatl-logo-white.png';

// Declare Cookiebot global
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

export default function CookieBanner() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Choose logo based on theme
  const actualTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  const brandLogo = actualTheme === 'dark' ? logoDark : logoLight;

  useEffect(() => {
    // Wait for Cookiebot to load
    const checkCookiebot = setInterval(() => {
      if (window.Cookiebot) {
        clearInterval(checkCookiebot);
        
        // Show banner if user hasn't consented yet
        if (!window.Cookiebot.consented && !window.Cookiebot.declined) {
          setTimeout(() => {
            setIsVisible(true);
            setTimeout(() => setIsAnimating(true), 50);
          }, 1000); // Small delay for better UX
        }
      }
    }, 100);

    return () => clearInterval(checkCookiebot);
  }, []);

  const handleAcceptAll = () => {
    if (window.Cookiebot) {
      window.Cookiebot.submitCustomConsent(true, true, true, true);
      closeBanner();
    }
  };

  const handleRejectAll = () => {
    if (window.Cookiebot) {
      window.Cookiebot.submitCustomConsent(true, false, false, false);
      closeBanner();
    }
  };

  const handleCustomize = () => {
    if (window.Cookiebot) {
      window.Cookiebot.renew();
      // Don't close banner - let user complete their choice in Cookiebot dialog
    }
  };

  const closeBanner = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - subtle overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Cookie Banner - Full Width Bottom */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl overflow-hidden max-w-7xl mx-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Logo */}
          <div className="flex items-center justify-between py-4 sm:py-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <img src={brandLogo} alt="ChatLearn" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {t('cookieBanner.title', 'Cookie Preferences')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('cookieBanner.subtitle', 'Manage your privacy settings')}
                </p>
              </div>
            </div>
            <button
              onClick={closeBanner}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50 flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {t('cookieBanner.description', 
                  'We use cookies to enhance your experience, analyze traffic, and serve personalized content.'
                )}
                {' '}
                <a 
                  href="https://www.chatl.ai/cookie-policy" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('cookieBanner.learnMore', 'Learn more')}
                </a>
              </p>

              {/* Action Buttons - Horizontal on desktop, vertical on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all hover:shadow-md"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t('cookieBanner.acceptAll', 'Accept All')}
                </Button>
                
                <Button
                  onClick={handleCustomize}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto font-medium border-border/60 hover:border-border hover:bg-muted/50"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  {t('cookieBanner.customize', 'Settings')}
                </Button>
                
                <Button
                  onClick={handleRejectAll}
                  size="sm"
                  variant="ghost"
                  className="w-full sm:w-auto font-medium hover:bg-muted/50"
                >
                  {t('cookieBanner.rejectAll', 'Reject')}
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
