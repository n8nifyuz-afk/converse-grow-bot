import { useState, useEffect } from 'react';
import { Cookie, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeBanner}
      />

      {/* Cookie Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300 ease-out ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="container max-w-6xl mx-auto p-4 pb-6 sm:pb-8">
          <div className="bg-background border-2 border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-4 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Cookie className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('cookieBanner.title', 'We Value Your Privacy')}
                  </h3>
                </div>
                <button
                  onClick={closeBanner}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                {t('cookieBanner.description', 
                  'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.'
                )}
                {' '}
                <a 
                  href="/cookies" 
                  className="text-primary hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('cookieBanner.learnMore', 'Learn more')}
                </a>
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptAll}
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {t('cookieBanner.acceptAll', 'Accept All')}
                </Button>
                
                <Button
                  onClick={handleCustomize}
                  size="lg"
                  variant="outline"
                  className="flex-1 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('cookieBanner.customize', 'Customize')}
                </Button>
                
                <Button
                  onClick={handleRejectAll}
                  size="lg"
                  variant="ghost"
                  className="flex-1 hover:bg-muted font-semibold"
                >
                  {t('cookieBanner.rejectAll', 'Reject All')}
                </Button>
              </div>

              {/* Footer Note */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t('cookieBanner.footerNote', 'You can change your preferences at any time in your browser settings.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
