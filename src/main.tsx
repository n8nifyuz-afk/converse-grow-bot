import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initLanguageDetection } from "./hooks/useLanguageDetection";
import { initializeGTMWithGCLID } from "./utils/gtmTracking";

// Initialize language detection
initLanguageDetection();

// Initialize GTM with GCLID after React is ready
setTimeout(() => {
  try {
    initializeGTMWithGCLID();
  } catch (error) {
    console.error('Failed to initialize GTM:', error);
  }
}, 0);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
