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
      // Don't call event.preventDefault() here during debug — allow browser logging.
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

(function dynamicCookiebotPadding() {
  const GAP = 12; // banner va content orasidagi kichik bo'sh joy
  let ro = null;
  let mo = null;
  let lastHeight = 0;

  function findDialogEl() {
    return (
      document.getElementById("CybotCookiebotDialog") ||
      document.querySelector(".CybotCookiebotDialog") ||
      document.querySelector('[id^="CybotCookiebot"]') ||
      document.querySelector('iframe[src*="consent.cookiebot.com"], iframe[id*="CybotCookiebot"]')
    );
  }

  function applyPaddingFor(height) {
    const pb = Math.ceil(height + GAP);
    document.body.style.paddingBottom = pb > 0 ? pb + "px" : "";
    document.body.classList.add("cookiebot-visible");
  }

  function clearPadding() {
    document.body.style.paddingBottom = "";
    document.body.classList.remove("cookiebot-visible");
  }

  function measureAndApply() {
    const el = findDialogEl();
    if (!el) {
      clearPadding();
      return;
    }
    // If iframe, measure via boundingRect; Cookiebot dialog maybe inside iframe -- fallback heights
    let rect = null;
    try {
      rect = el.getBoundingClientRect();
    } catch (e) {
      rect = { height: el.offsetHeight || 0 };
    }
    const h =
      rect.height ||
      (el.contentWindow && el.contentWindow.document && el.contentWindow.document.body
        ? el.contentWindow.document.body.scrollHeight
        : 0) ||
      0;
    if (h !== lastHeight) {
      lastHeight = h;
      applyPaddingFor(h);
    }
  }

  function observeMutations() {
    if (mo) return;
    try {
      mo = new MutationObserver(() => {
        // DOM changed; re-measure shortly
        setTimeout(measureAndApply, 120);
      });
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  function observeResize(el) {
    if (typeof ResizeObserver === "undefined") return;
    try {
      ro = new ResizeObserver(() => measureAndApply());
      ro.observe(document.documentElement || document.body);
      // also try observing dialog itself when present
      const dialog = findDialogEl();
      if (dialog) ro.observe(dialog);
    } catch (e) {}
  }

  // listen to window events
  window.addEventListener("resize", measureAndApply);
  window.addEventListener("orientationchange", () => setTimeout(measureAndApply, 200));

  // initial tries + observer
  let tries = 0;
  const MAX_TRIES = 60;
  const interval = setInterval(() => {
    tries++;
    measureAndApply();
    observeMutations();
    observeResize();
    if (tries > MAX_TRIES) clearInterval(interval);
  }, 300);

  // also attempt manual show for debugging (safe no-op)
  try {
    if (window.Cookiebot && window.Cookiebot.show) {
      /* noop */
    }
  } catch (e) {}

  // expose helper for debug
  (window as any).__measureCookiebot = measureAndApply;
})();
