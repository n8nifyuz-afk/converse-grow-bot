import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleScrollToSection = (sectionId: string) => {
    // If not on home page, navigate to home first
    if (location.pathname !== '/home') {
      navigate('/home');
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="py-16 px-4 bg-gradient-to-b from-muted/30 to-muted/60">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-xl font-bold text-black dark:text-white">ChatLearn</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-bold mb-6 text-lg">{t('footer.product')}</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleScrollToSection('ai-models-section')} 
                className="block text-left text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.aiTools')}
              </button>
              <button 
                onClick={() => navigate('/pricing')} 
                className="block text-left text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.pricing')}
              </button>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-bold mb-6 text-lg">{t('footer.company')}</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleScrollToSection('features-section')} 
                className="block text-left text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.whatYouCanDo')}
              </button>
              <a href="/about" className="block text-muted-foreground hover:text-primary transition-colors">{t('footer.aboutUs')}</a>
              <a href="/help" className="block text-muted-foreground hover:text-primary transition-colors">{t('footer.helpCenter')}</a>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-bold mb-6 text-lg">{t('footer.legal')}</h3>
            <div className="space-y-3">
              <a href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">{t('footer.privacyPolicy')}</a>
              <a href="/terms" className="block text-muted-foreground hover:text-primary transition-colors">{t('footer.termsOfService')}</a>
              <a href="/cookie-policy" className="block text-muted-foreground hover:text-primary transition-colors">{t('footer.cookiePolicy')}</a>
              <a href="/refund-policy" className="block text-muted-foreground hover:text-primary transition-colors">{t('footer.refundPolicy')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
