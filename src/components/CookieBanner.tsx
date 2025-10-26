import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

declare global {
  interface Window {
    Cookiebot?: {
      submitConsent: (necessary: boolean, statistics: boolean, preferences: boolean, marketing: boolean) => void;
      show: () => void;
      hide: () => void;
      consent?: {
        necessary: boolean;
        statistics: boolean;
        marketing: boolean;
        preferences: boolean;
        stamp?: string;
        method?: string;
      };
      hasResponse?: boolean;
    };
    CookieConsent?: {
      submitConsent: (options: any) => void;
    };
    gtag?: (...args: any[]) => void;
  }
}

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: true,
    marketing: true,
    preferences: true,
  });

  useEffect(() => {
    // Force hide Cookiebot's default banner
    const hideCookiebotBanner = () => {
      const cookiebotDialog = document.getElementById('CybotCookiebotDialog');
      if (cookiebotDialog) {
        cookiebotDialog.style.display = 'none';
      }
    };

    // Wait for Cookiebot to load
    const checkCookiebot = () => {
      // Always hide Cookiebot's default banner
      hideCookiebotBanner();
      
      // Also check periodically in case it appears later
      const interval = setInterval(hideCookiebotBanner, 500);
      setTimeout(() => clearInterval(interval), 5000);
      if (window.Cookiebot) {
        // Check if Cookiebot already has consent using hasResponse
        const hasConsent = window.Cookiebot.hasResponse || 
                          (window.Cookiebot.consent && window.Cookiebot.consent.stamp);
        
        if (hasConsent) {
          // User already responded through Cookiebot
          console.log('Cookiebot consent already exists');
          setShowBanner(false);
          
          // Sync preferences with Cookiebot if consent object exists
          if (window.Cookiebot.consent) {
            setPreferences({
              analytics: window.Cookiebot.consent.statistics || false,
              marketing: window.Cookiebot.consent.marketing || false,
              preferences: window.Cookiebot.consent.preferences || false,
            });
          }
        } else {
          // No consent yet, show our banner
          setTimeout(() => setShowBanner(true), 1000);
        }
      } else {
        // Fallback: Check localStorage if Cookiebot not available
        const localConsent = localStorage.getItem('cookieConsent');
        if (!localConsent) {
          setTimeout(() => setShowBanner(true), 1000);
        }
      }
    };

    // Listen for Cookiebot events
    const handleCookiebotLoad = () => {
      console.log('Cookiebot loaded');
      hideCookiebotBanner();
      checkCookiebot();
    };

    const handleCookiebotAccept = () => {
      console.log('Cookiebot consent accepted');
      hideCookiebotBanner();
      setShowBanner(false);
    };

    const handleCookiebotDecline = () => {
      console.log('Cookiebot consent declined');
      hideCookiebotBanner();
      setShowBanner(false);
    };

    const handleCookiebotConsentUpdated = () => {
      console.log('Cookiebot consent updated');
      hideCookiebotBanner();
      checkCookiebot();
    };

    // Initial check
    if (window.Cookiebot) {
      checkCookiebot();
    } else {
      // Wait for Cookiebot to load
      window.addEventListener('CookiebotOnLoad', handleCookiebotLoad);
    }

    window.addEventListener('CookiebotOnAccept', handleCookiebotAccept);
    window.addEventListener('CookiebotOnDecline', handleCookiebotDecline);
    window.addEventListener('CookiebotOnDialogDisplay', () => {
      hideCookiebotBanner();
      setShowBanner(false);
    });
    window.addEventListener('CookiebotOnConsentReady', handleCookiebotConsentUpdated);

    return () => {
      window.removeEventListener('CookiebotOnLoad', handleCookiebotLoad);
      window.removeEventListener('CookiebotOnAccept', handleCookiebotAccept);
      window.removeEventListener('CookiebotOnDecline', handleCookiebotDecline);
      window.removeEventListener('CookiebotOnConsentReady', handleCookiebotConsentUpdated);
    };
  }, []);

  const trackConsent = (action: string, details: any) => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'cookie_consent',
        consent_action: action,
        consent_details: details,
      });
    }
  };

  const submitConsent = (statistics: boolean, marketing: boolean, prefs: boolean) => {
    const consentData = {
      necessary: true,
      statistics,
      marketing,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));

    // Submit to Cookiebot if available
    if (window.Cookiebot) {
      window.Cookiebot.submitConsent(true, statistics, prefs, marketing);
    } else if (window.CookieConsent) {
      window.CookieConsent.submitConsent({
        level: ['necessary'],
        statistics,
        marketing,
        preferences: prefs,
      });
    }

    // Track consent
    trackConsent('consent_given', consentData);

    // Update Google Consent Mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: statistics ? 'granted' : 'denied',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied',
      });
    }
  };

  const handleAcceptAll = () => {
    submitConsent(true, true, true);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    submitConsent(false, false, false);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    submitConsent(preferences.analytics, preferences.marketing, preferences.preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-400">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/chatl-logo-white.png" 
                alt="ChatL" 
                className="h-12 w-auto"
              />
            </div>

            {/* Text */}
            <div>
              <h3 className="text-base font-semibold mb-2">We use cookies</h3>
              <p className="text-sm opacity-90">
                We use cookies to enhance your experience, analyze traffic, and for marketing. 
                By clicking "Accept All", you consent to our use of cookies.{' '}
                <a href="/cookie-policy" className="underline hover:opacity-80">
                  Learn more
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap md:flex-nowrap">
              <Button
                variant="ghost"
                onClick={() => setShowSettings(true)}
                className="bg-white/5 border border-white/20 hover:bg-white/10 text-white"
              >
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectAll}
                className="bg-white/10 border border-white/30 hover:bg-white/15 hover:border-white/50 text-white"
              >
                Reject
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="bg-white text-[#1a1a2e] hover:bg-gray-100"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Essential */}
            <div className="space-y-2 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Checkbox checked disabled />
                <Label className="font-semibold">Essential Cookies</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Required for the website to function properly. These cannot be disabled.
              </p>
            </div>

            {/* Analytics */}
            <div className="space-y-2 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, analytics: checked as boolean }))
                  }
                />
                <Label className="font-semibold cursor-pointer">Analytics</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Help us understand how visitors use our site to improve performance.
              </p>
            </div>

            {/* Marketing */}
            <div className="space-y-2 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, marketing: checked as boolean }))
                  }
                />
                <Label className="font-semibold cursor-pointer">Marketing</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Used to deliver personalized ads and measure campaign effectiveness.
              </p>
            </div>

            {/* Preferences */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.preferences}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, preferences: checked as boolean }))
                  }
                />
                <Label className="font-semibold cursor-pointer">Preferences</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Remember your preferences to provide a personalized experience.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
