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
      closeBanner();
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
        onClick={closeBanner}
      />

      {/* Cookie Banner - Modern Card Design */}
      <div
        className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md z-[9999] transition-all duration-500 ease-out ${
          isAnimating ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header with Logo */}
          <div className="flex items-start justify-between p-5 pb-4 border-b border-border/50">
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
          <div className="p-5 pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('cookieBanner.description', 
                'We use cookies to enhance your experience, analyze traffic, and serve personalized content.'
              )}
              {' '}
              <a 
                href="/cookies" 
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('cookieBanner.learnMore', 'Learn more')}
              </a>
            </p>

            {/* Action Buttons - Vertical Stack */}
            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all hover:shadow-md"
              >
                <Check className="h-4 w-4 mr-2" />
                {t('cookieBanner.acceptAll', 'Accept All')}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleCustomize}
                  size="sm"
                  variant="outline"
                  className="font-medium border-border/60 hover:border-border hover:bg-muted/50"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  {t('cookieBanner.customize', 'Settings')}
                </Button>
                
                <Button
                  onClick={handleRejectAll}
                  size="sm"
                  variant="ghost"
                  className="font-medium hover:bg-muted/50"
                >
                  {t('cookieBanner.rejectAll', 'Reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
