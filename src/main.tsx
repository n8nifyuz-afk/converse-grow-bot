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
  // inside src/main.tsx (replace smartCookiebotPortal() with this)
  (function smartCookiebotPortal() {
    const MAX_TRIES = 30;
    const TRY_INTERVAL = 300;
    let tries = 0;

    function findDialog(): HTMLElement | null {
      return (document.getElementById("CybotCookiebotDialog") ||
        document.querySelector('[id^="CybotCookiebot"]') ||
        document.querySelector(".CybotCookiebotDialog")) as HTMLElement | null;
    }

    function applyBarStyle(el: HTMLElement) {
      el.style.position = "fixed";
      el.style.left = "0";
      el.style.right = "0";
      el.style.bottom = "0";
      el.style.width = "100%";
      el.style.maxWidth = "none";
      el.style.margin = "0";
      el.style.borderRadius = "0";
      el.style.zIndex = "2147483647";
      el.style.display = "block";
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      // Important: remove transforms that could create containing block
      try {
        el.style.transform = "none";
      } catch (e) {}
      // ensure inner content stretches
      try {
        const inner = el.querySelector(
          ".CybotCookiebotDialogContentWrapper, .CybotCookiebotScrollContainer, .CybotCookiebotDialogBodyContent",
        ) as HTMLElement | null;
        if (inner) inner.style.width = "100%";
      } catch (e) {}
    }

    function enforce(el: HTMLElement) {
      const cls = (el.className || "").toLowerCase();
      const looksLikeBar =
        cls.includes("bar") ||
        (!!el.querySelector(".CybotCookiebotScrollContainer") && window.innerWidth <= 1400) ||
        !!document.querySelector(".CybotCookiebotDialogDetailFooter");

      if (looksLikeBar) applyBarStyle(el);
      else {
        // fallback dialog styling
        el.style.position = "fixed";
        el.style.left = "50%";
        el.style.transform = "translateX(-50%)";
        el.style.bottom = "10px";
        el.style.right = "auto";
        el.style.maxWidth = "640px";
        el.style.zIndex = "2147483647";
        el.style.display = "block";
        el.style.visibility = "visible";
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
      }
    }

    function tryMove() {
      tries++;
      const el = findDialog();
      if (!el) {
        if (tries < MAX_TRIES) return setTimeout(tryMove, TRY_INTERVAL);
        return;
      }

      // move to body to avoid clipping by app containers
      try {
        if (el.parentElement !== document.body) document.body.appendChild(el);
      } catch (e) {}

      // remove hide classes if present
      ["CybotCookiebotDialogHide", "cybot-cookiebot-hide", "hidden", "hide"].forEach((cl) => el.classList.remove(cl));

      // enforce style and ensure visible
      enforce(el);

      // add body class to avoid content overlap
      document.body.classList.add("cookiebot-visible");

      // observe attribute + child changes and re-enforce for longer
      try {
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === "attributes" || m.type === "childList") enforce(el);
          }
        });
        mo.observe(el, { attributes: true, childList: true, subtree: true });
        // keep observer longer to handle late cookiebot changes
        setTimeout(() => mo.disconnect(), 120000); // 2 minutes
      } catch (e) {}
    }

    setTimeout(tryMove, 500);
  })();
}

// Cookiebot body-class helper: add/remove body.cookiebot-visible when dialog present
if (typeof window !== "undefined") {
  (function cookiebotBodyFlag() {
    const find = () =>
      document.getElementById("CybotCookiebotDialog") ||
      document.querySelector('[id^="CybotCookiebot"]') ||
      document.querySelector(".CybotCookiebotDialog");

    const setFlag = (present: boolean) => {
      if (present) document.body.classList.add("cookiebot-visible");
      else document.body.classList.remove("cookiebot-visible");
    };

    const enforceStyles = (el: HTMLElement | null) => {
      if (!el) return;
      // remove transform that shifts it offscreen
      try {
        el.style.setProperty("transform", "none", "important");
        el.style.setProperty("left", "0", "important");
        el.style.setProperty("right", "0", "important");
        el.style.setProperty("bottom", "0", "important");
      } catch (e) {}
    };

    const scanAndApply = () => {
      const el = find() as HTMLElement | null;
      if (el) {
        setFlag(true);
        enforceStyles(el);
      } else {
        setFlag(false);
      }
    };

    // run initially and then observe
    setTimeout(scanAndApply, 500);
    try {
      const mo = new MutationObserver(() => scanAndApply());
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
      // stop observing after 30s
      setTimeout(() => mo.disconnect(), 30000);
    } catch (e) {}
  })();
}
