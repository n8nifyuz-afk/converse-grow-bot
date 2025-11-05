import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

declare global {
  interface Window {
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
    // Check if user has already responded
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Small delay to ensure page loads first
      setTimeout(() => setShowBanner(true), 1000);
    }
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

    console.log('🍪 [Cookie Banner] Saving consent preferences:', consentData);

    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));

    // Track consent
    trackConsent('consent_given', consentData);

    // Update Google Consent Mode
    if (window.gtag) {
      const consentUpdate = {
        analytics_storage: statistics ? 'granted' : 'denied',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied',
      };
      
      console.log('📊 [Cookie Banner] Updating Google Consent Mode:', consentUpdate);
      window.gtag('consent', 'update', consentUpdate);
      console.log('✅ [Cookie Banner] Consent updated successfully');
    } else {
      console.warn('⚠️ [Cookie Banner] gtag function not available');
    }
  };

  const handleAcceptAll = () => {
    submitConsent(true, true, true);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    // When rejecting, we still allow conversion tracking (GDPR compliant)
    // Only block personalization/remarketing
    const consentData = {
      necessary: true,
      statistics: true,  // Keep basic analytics
      marketing: false,  // Block remarketing
      preferences: false,
      timestamp: new Date().toISOString(),
    };

    console.log('🍪 [Cookie Banner] Saving REJECT consent (conversion tracking still enabled):', consentData);
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    trackConsent('consent_rejected', consentData);

    // Update consent: Keep conversion tracking, block personalization
    if (window.gtag) {
      const consentUpdate = {
        analytics_storage: 'granted',     // ✅ Keep analytics
        ad_storage: 'denied',             // ❌ Block remarketing
        ad_user_data: 'granted',          // ✅ Keep conversion tracking
        ad_personalization: 'denied',     // ❌ Block personalization
      };
      
      console.log('📊 [Cookie Banner] Updating consent after REJECT:', consentUpdate);
      window.gtag('consent', 'update', consentUpdate);
    }
    
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
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-muted/95 backdrop-blur-sm border-t border-border text-foreground shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-400">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/chatl-logo-black.png" 
                alt="ChatL" 
                className="h-12 w-auto dark:hidden"
              />
              <img 
                src="/chatl-logo-white.png" 
                alt="ChatL" 
                className="h-12 w-auto hidden dark:block"
              />
            </div>

            {/* Text */}
            <div>
              <h3 className="text-base font-semibold mb-2">We use cookies</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your experience, analyze traffic, and for marketing. 
                By clicking "Accept All", you consent to our use of cookies.{' '}
                <a href="/cookie-policy" className="underline hover:opacity-70">
                  Learn more
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap md:flex-nowrap">
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
              >
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectAll}
              >
                Reject
              </Button>
              <Button
                variant="default"
                onClick={handleAcceptAll}
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
