// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initLanguageDetection } from "./hooks/useLanguageDetection";
import { initializeGTMWithGCLID } from "./utils/gtmTracking";

// Initialize language detection
initLanguageDetection();

// --- Debug helpers (tekincha, keyin olib tashlash mumkin) ---
if (typeof window !== "undefined") {
  // quick trace that main loaded
  try {
    console.info("[DEBUG] main.tsx loaded");
  } catch (e) {}
}

// --- Global error handlers (softer; show full errors in DEV) ---
if (typeof window !== "undefined") {
  const thirdPartyDomains = [
    "googletagmanager.com",
    "google-analytics.com",
    "cookiebot.com",
    "consent.cookiebot.com",
    "gstatic.com",
    "doubleclick.net",
  ];

  window.addEventListener("error", (event) => {
    const filename = event.filename || "";
    const isThirdPartyError =
      event.message === "Script error." ||
      !event.filename ||
      event.lineno === 0 ||
      thirdPartyDomains.some((domain) => filename.includes(domain));

    if (isThirdPartyError) {
      // DEV: show non-fatal third-party errors but don't block render
      if (import.meta.env.DEV) {
        console.warn("[DEBUG] Non-critical external script error (allowed):", {
          message: event.message,
          filename: filename || "unknown",
          lineno: event.lineno,
          colno: event.colno,
        });
      }
      // Prevent this error from blocking app execution
      event.preventDefault();
      return;
    }

    // Critical (app) errors: always log full info
    console.error("[CRITICAL] window.error:", event.error || event.message, {
      filename: filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: (event.error && (event.error as any).stack) || null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason || {};
    const reasonMsg = typeof reason === "string" ? reason : reason.message || "";
    const isThirdPartyRejection =
      reasonMsg.includes &&
      (reasonMsg.includes("cookiebot") || reasonMsg.includes("gtm") || reasonMsg.includes("analytics"));

    if (isThirdPartyRejection) {
      if (import.meta.env.DEV) {
        console.warn("[DEBUG] Non-critical third-party unhandled rejection:", event.reason);
      }
      return;
    }

    // Log all other rejections
    console.error("[CRITICAL] unhandledrejection:", event.reason);
  });
}

// --- GTM init: only when Cookiebot consent allows (statistics or marketing) ---
// This wrapper ensures:
//  - initializeGTMWithGCLID() is called only after consent
//  - initializeGTMWithGCLID() runs at most once
//  - provides timeouts and event fallback for Cookiebot
if (typeof window !== "undefined") {
  const _WIN = window as any;

  const initGTMWhenAllowed = () => {
    try {
      if (_WIN._gtmInitialized) {
        if (import.meta.env.DEV) console.info("[DEBUG] GTM already initialized, skipping.");
        return;
      }

      const cookiebot = _WIN.Cookiebot;
      if (cookiebot && cookiebot.consent) {
        if (cookiebot.consent.statistics || cookiebot.consent.marketing) {
          if (import.meta.env.DEV) console.info("[DEBUG] Cookiebot consent present - initializing GTM.");
          initializeGTMWithGCLID();
          _WIN._gtmInitialized = true;
        } else {
          if (import.meta.env.DEV) console.info("[DEBUG] Cookiebot present but no analytics/marketing consent yet.");
        }
        return;
      }

      // Polling fallback: cookiebot not ready yet — wait up to 20s
      let waited = 0;
      const pollInterval = 300;
      const timeoutMs = 20000;
      const iv = setInterval(() => {
        try {
          const cb = (window as any).Cookiebot;
          if (cb && cb.consent && (cb.consent.statistics || cb.consent.marketing)) {
            clearInterval(iv);
            if (import.meta.env.DEV)
              console.info("[DEBUG] Cookiebot consent detected during polling - initializing GTM.");
            initializeGTMWithGCLID();
            _WIN._gtmInitialized = true;
            return;
          }
          waited += pollInterval;
          if (waited > timeoutMs) {
            clearInterval(iv);
            if (import.meta.env.DEV)
              console.warn("[DEBUG] Cookiebot consent not found within timeout; GTM not initialized.");
          }
        } catch (err) {
          clearInterval(iv);
          if (import.meta.env.DEV) console.error("[DEBUG] Error during Cookiebot polling:", err);
        }
      }, pollInterval);

      // Event fallback: try to listen for Cookiebot accept events
      try {
        window.addEventListener?.(
          "CookiebotOnAccept",
          () => {
            if (!_WIN._gtmInitialized) {
              if (import.meta.env.DEV) console.info("[DEBUG] CookiebotOnAccept event fired - initializing GTM.");
              initializeGTMWithGCLID();
              _WIN._gtmInitialized = true;
            }
          },
          false,
        );
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[DEBUG] Could not add CookiebotOnAccept listener", e);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error("[DEBUG] initGTMWhenAllowed error:", e);
    }
  };

  // schedule initialization at idle to avoid blocking initial renders
  const scheduleInit = () => {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(initGTMWhenAllowed);
    } else {
      setTimeout(initGTMWhenAllowed, 0);
    }
  };

  scheduleInit();
}

// --- Finally mount React with error recovery ---
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error("[CRITICAL] Failed to mount React app:", error);
  
  // Fallback UI if React fails to mount
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: system-ui, -apple-system, sans-serif;">
        <div style="max-width: 500px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">Failed to Load Application</h1>
          <p style="color: #666; margin-bottom: 1.5rem;">
            We encountered an error while starting the app. Please try refreshing the page.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="background: #000; color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;"
          >
            Refresh Page
          </button>
          <details style="margin-top: 1.5rem; text-align: left; padding: 1rem; background: #f5f5f5; border-radius: 0.5rem;">
            <summary style="cursor: pointer; font-weight: 500;">Error Details</summary>
            <pre style="margin-top: 0.5rem; font-size: 0.875rem; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
          </details>
        </div>
      </div>
    `;
  }
}
