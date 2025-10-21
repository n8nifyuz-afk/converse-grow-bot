import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import logoLight from '@/assets/chatl-logo-black.png';
import logoDark from '@/assets/chatl-logo-white.png';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme, actualTheme } = useTheme();
  const { user, userProfile } = useAuth();
  const { t } = useTranslation();

  // Choose the correct logo based on theme
  const currentLogo = actualTheme === 'dark' ? logoDark : logoLight;

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
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo and Text */}
          <Link to="/home" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm">
            <img src={currentLogo} alt="ChatLearn Logo" className="h-7 w-7" />
            <span className="text-xl font-bold text-foreground">ChatLearn</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleScrollToSection('ai-models-section')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              {t('nav.aiTools')}
            </button>
            <Link 
              to="/features" 
              onClick={() => window.scrollTo(0, 0)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              {t('nav.whatYouCanDo')}
            </Link>
            <Link 
              to="/pricing" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              {t('nav.pricing')}
            </Link>
            <Link 
              to="/contact" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Theme Toggle & CTA Button */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full p-0 hover:bg-muted transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 transition-transform" />
              ) : (
                <Sun className="h-4 w-4 transition-transform" />
              )}
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-black text-white hover:bg-black/90 focus:ring-2 focus:ring-black focus:ring-offset-2"
              onMouseEnter={() => {
                // Prefetch / route
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = '/';
                document.head.appendChild(link);
              }}
            >
              {t('nav.startNow')}
            </Button>

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold">{t('nav.menu')}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-9 w-9 rounded-full p-0 hover:bg-muted transition-colors"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                  >
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <nav className="flex flex-col space-y-4">
                  <button 
                    onClick={() => handleScrollToSection('ai-models-section')}
                    className="text-lg font-medium hover:text-primary transition-colors text-left"
                  >
                    {t('nav.aiTools')}
                  </button>
                  <Link 
                    to="/features" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => {
                      setIsOpen(false);
                      window.scrollTo(0, 0);
                    }}
                  >
                    {t('nav.whatYouCanDo')}
                  </Link>
                  <Link 
                    to="/pricing" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav.pricing')}
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('nav.contact')}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;