/**
 * Lightweight analytics — Quick Win #5 from ENGINEERING_ASSESSMENT.md
 * ("No analytics. No way to answer 'which press releases actually get
 * read' or 'did the Grand Opening announcement get picked up'").
 *
 * Uses GA4 (gtag.js), loaded on demand only when VITE_GA_MEASUREMENT_ID is
 * configured — total no-op otherwise, so nothing is loaded or sent in local
 * dev by default. Swap for Plausible later if preferred (this module is the
 * only place that would need to change; every call site below stays the
 * same).
 *
 * Cookie-consent gated: GA4 sets tracking cookies, so this only actually
 * loads gtag.js once the visitor has explicitly accepted via the cookie
 * consent banner (see CookieConsentBanner.tsx / cookieConsent.ts) — calling
 * initAnalytics() before that consent exists is a silent no-op by design,
 * not just a missing-config no-op.
 */
import { hasAnalyticsConsent } from './cookieConsent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Call once at app startup, and again whenever consent is granted via the
 * cookie banner. Injects gtag.js only if a measurement ID is configured
 * AND the visitor has accepted analytics cookies. */
export function initAnalytics() {
  if (initialized) return;
  if (!hasAnalyticsConsent()) {
    console.info('[analytics] Waiting on cookie consent — analytics disabled until accepted.');
    return;
  }
  initialized = true;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId) {
    console.info('[analytics] VITE_GA_MEASUREMENT_ID not set — analytics disabled (dev/local default).');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  gtag('js', new Date());
  // send_page_view is disabled here because this is a client-routed SPA —
  // trackPageview() below fires on every tab change instead, via App.tsx.
  gtag('config', measurementId, { send_page_view: false });
}

/** Fire on every in-app tab/view change (SPA equivalent of a page load). */
export function trackPageview(tabId: string) {
  if (!window.gtag) return;
  window.gtag('event', 'page_view', {
    page_title: tabId,
    page_path: `/${tabId}`,
  });
}

/** Fire for a specific named interaction, e.g. trackEvent('article_read', { articleId }). */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!window.gtag) return;
  window.gtag('event', eventName, params);
}
