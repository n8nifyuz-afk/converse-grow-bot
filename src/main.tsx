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

// --- Global error handlers (prevent third-party errors from breaking app) ---
if (typeof window !== "undefined") {
  const thirdPartyDomains = [
    "googletagmanager.com",
    "google-analytics.com",
    "googleidentityservice",
    "accounts.google.com",
    "cookiebot.com",
    "consent.cookiebot.com",
    "gstatic.com",
    "doubleclick.net",
  ];

  // Capture errors as early as possible with highest priority
  window.addEventListener("error", (event) => {
    const filename = event.filename || "";
    const message = event.message || "";
    
    // Identify third-party errors
    const isThirdPartyError =
      message === "Script error." ||
      message.includes("gsi") ||
      message.includes("Cookiebot") ||
      !event.filename ||
      event.lineno === 0 ||
      thirdPartyDomains.some((domain) => filename.includes(domain));

    if (isThirdPartyError) {
      // Prevent third-party errors from propagating to React
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      if (import.meta.env.DEV) {
        console.warn("[DEBUG] Blocked third-party error:", {
          message: message || "Script error.",
          filename: filename || "unknown",
          lineno: event.lineno,
          colno: event.colno,
        });
      }
      return;
    }

    // Critical app errors only
    console.error("[CRITICAL] App error:", event.error || event.message, {
      filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: (event.error && (event.error as any).stack) || null,
    });
  }, true); // Use capture phase for earliest interception

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason || {};
    const reasonMsg = typeof reason === "string" ? reason : reason.message || "";
    
    const isThirdPartyRejection =
      reasonMsg.includes &&
      (reasonMsg.includes("cookiebot") ||
       reasonMsg.includes("Cookiebot") ||
       reasonMsg.includes("gtm") ||
       reasonMsg.includes("gsi") ||
       reasonMsg.includes("analytics"));

    if (isThirdPartyRejection) {
      event.preventDefault();
      if (import.meta.env.DEV) {
        console.warn("[DEBUG] Blocked third-party rejection:", event.reason);
      }
      return;
    }

    console.error("[CRITICAL] Unhandled rejection:", event.reason);
  }, true);
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

// --- Finally mount React ---
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// paste AFTER createRoot(...).render(...)
(function ensureCookiebotOnBody() {
  const MAX_TRIES = 40,
    TRY_INTERVAL = 300;
  let tries = 0;
  function findIframe() {
    return document.querySelector('iframe[src*="consent.cookiebot.com"], iframe[id*="CybotCookiebot"]');
  }
  function findDialog() {
    return (
      document.getElementById("CybotCookiebotDialog") ||
      document.querySelector(".CybotCookiebotDialog") ||
      document.querySelector('[id^="CybotCookiebot"]')
    );
  }
  function ensureOnBody(el) {
    if (!el) return;
    try {
      if (el.parentElement !== document.body) document.body.appendChild(el);
    } catch (e) {}
    try {
      el.style.setProperty("z-index", "2147483647", "important");
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.removeProperty("width");
      el.style.removeProperty("transform");
    } catch (e) {}
  }
  function tryFix() {
    tries++;
    const iframe = findIframe();
    const dialog = findDialog();
    if (iframe) ensureOnBody(iframe);
    if (dialog) {
      ensureOnBody(dialog);
      document.body.classList.add("cookiebot-visible");
    }
    if (!iframe && !dialog && tries < MAX_TRIES) {
      setTimeout(tryFix, TRY_INTERVAL);
      return;
    }
    try {
      const mo = new MutationObserver(() => tryFix());
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
      setTimeout(() => mo.disconnect(), 120000);
    } catch (e) {}
  }
  setTimeout(tryFix, 500);
})();
