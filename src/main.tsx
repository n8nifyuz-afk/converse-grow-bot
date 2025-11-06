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
  window.addEventListener('error', (event) => {
    // Prevent blank screen from external script errors
    if (event.message === 'Script error.' || !event.filename) {
      event.preventDefault();
      if (import.meta.env.DEV) {
        console.warn('External script error prevented:', event);
      }
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    // Log unhandled promise rejections but don't crash
    if (import.meta.env.DEV) {
      console.error('Unhandled promise rejection:', event.reason);
    }
    event.preventDefault();
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
