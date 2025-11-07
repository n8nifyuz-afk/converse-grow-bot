import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initLanguageDetection } from "./hooks/useLanguageDetection";
import { initializeGTMWithGCLID } from "./utils/gtmTracking";

// Initialize language detection
initLanguageDetection();

// Add global error handlers to prevent blank screens
if (typeof window !== 'undefined') {
  // List of known third-party domains that can cause harmless errors
  const thirdPartyDomains = [
    'googletagmanager.com',
    'google-analytics.com',
    'cookiebot.com',
    'consent.cookiebot.com',
    'gstatic.com',
    'doubleclick.net'
  ];
  
  window.addEventListener('error', (event) => {
    // Prevent blank screen from external script errors
    const isThirdPartyError = event.message === 'Script error.' || 
                             !event.filename || 
                             event.lineno === 0 ||
                             thirdPartyDomains.some(domain => event.filename?.includes(domain));
    
    if (isThirdPartyError) {
      event.preventDefault();
      if (import.meta.env.DEV) {
        console.warn('External script error prevented (non-critical):', {
          message: event.message,
          filename: event.filename || 'Unknown',
          source: 'likely third-party tracking'
        });
      }
      return;
    }
    
    // Log critical errors
    console.error('Critical error:', event);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    // Log unhandled promise rejections but don't crash for non-critical ones
    const isThirdPartyRejection = event.reason?.message?.includes('cookiebot') ||
                                  event.reason?.message?.includes('gtm') ||
                                  event.reason?.message?.includes('analytics');
    
    if (isThirdPartyRejection) {
      event.preventDefault();
      if (import.meta.env.DEV) {
        console.warn('Third-party promise rejection prevented:', event.reason);
      }
      return;
    }
    
    if (import.meta.env.DEV) {
      console.error('Unhandled promise rejection:', event.reason);
    }
  });
}

// Initialize GTM with GCLID after React is ready
// Use requestIdleCallback for better performance and error isolation
if (typeof window !== 'undefined') {
  const initGTM = () => {
    try {
      initializeGTMWithGCLID();
    } catch (error) {
      // Silently catch GTM errors to prevent blank screen
      if (import.meta.env.DEV) {
        console.error('Failed to initialize GTM:', error);
      }
    }
  };
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initGTM);
  } else {
    setTimeout(initGTM, 0);
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
