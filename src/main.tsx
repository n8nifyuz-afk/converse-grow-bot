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

// --- Robust Cookiebot keep-visible helper (paste into src/main.tsx after mount) ---
if (typeof window !== "undefined") {
  (function smartCookiebotPortal() {
    const MAX_TRIES = 12;
    const TRY_INTERVAL = 300;
    let tries = 0;

    function findDialog(): HTMLElement | null {
      return (document.getElementById("CybotCookiebotDialog") ||
        document.querySelector('[id^="CybotCookiebot"]') ||
        document.querySelector(".CybotCookiebotDialog")) as HTMLElement | null;
    }

    function applyBarStyle(el: HTMLElement) {
      // keep Cookiebot's own look but force full-width bottom bar
      el.style.setProperty("position", "fixed", "important");
      el.style.setProperty("left", "0", "important");
      el.style.setProperty("right", "0", "important");
      el.style.setProperty("bottom", "0", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("border-radius", "0", "important");
      el.style.setProperty("z-index", "2147483647", "important");
      el.style.setProperty("display", "block", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("pointer-events", "auto", "important");

      // ensure inner content stretches
      try {
        const inner = el.querySelector(
          ".CybotCookiebotDialogContentWrapper, .CybotCookiebotScrollContainer, .CybotCookiebotDialogBodyContent",
        );
        if (inner && inner instanceof HTMLElement) {
          inner.style.setProperty("width", "100%", "important");
        }
      } catch (e) {}
    }

    function applyDialogStyle(el: HTMLElement) {
      // keep as dialog but ensure visible and centered
      el.style.setProperty("position", "fixed", "important");
      el.style.setProperty("left", "50%", "important");
      el.style.setProperty("transform", "translateX(-50%)", "important");
      el.style.setProperty("bottom", "10px", "important");
      el.style.setProperty("right", "auto", "important");
      el.style.setProperty("width", "auto", "important");
      el.style.setProperty("max-width", "640px", "important");
      el.style.setProperty("z-index", "2147483647", "important");
      el.style.setProperty("display", "block", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("pointer-events", "auto", "important");
    }

    function enforce(el: HTMLElement) {
      // decide layout by checking classes or attributes set by Cookiebot
      const cls = (el.className || "").toLowerCase();
      // heuristics: if admin set "bar" layout, Cookiebot often renders banner elements with 'scroll container' at bottom.
      const looksLikeBar =
        cls.includes("bar") ||
        (!!el.querySelector(".CybotCookiebotScrollContainer") && getComputedStyle(el).width === "100%") ||
        !!document.querySelector(".CybotCookiebotDialogDetailFooter"); // fallback heuristic

      if (looksLikeBar) applyBarStyle(el);
      else applyDialogStyle(el);
    }

    function tryMove() {
      tries++;
      const el = findDialog();
      if (!el) {
        if (tries < MAX_TRIES) return setTimeout(tryMove, TRY_INTERVAL);
        return;
      }

      // move to body to avoid clipping
      try {
        if (el.parentElement !== document.body) document.body.appendChild(el);
      } catch (e) {}

      // remove any hide classes if present
      ["CybotCookiebotDialogHide", "cybot-cookiebot-hide", "hidden", "hide"].forEach((cl) => el.classList.remove(cl));

      enforce(el);

      // observe element for attribute changes and re-enforce
      try {
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === "attributes" || m.type === "childList") {
              enforce(el);
            }
          }
        });
        mo.observe(el, { attributes: true, childList: true, subtree: true });
        setTimeout(() => mo.disconnect(), 30000);
      } catch (e) {}
    }

    setTimeout(tryMove, 500);
  })();
}
