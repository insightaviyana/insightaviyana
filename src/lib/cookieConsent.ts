/**
 * Cookie consent state — backs CookieConsentBanner.tsx.
 *
 * Only analytics (GA4, which sets real tracking cookies) is gated by this.
 * The theme/language preference keys (see i18n.tsx, App.tsx) and the error
 * monitoring in monitoring.ts are NOT gated: they're strictly-necessary
 * functional storage (remembering a UI choice) and a cookie-free direct
 * HTTP report respectively, neither of which the "accept/reject cookies"
 * choice is about — gating those too would make the site remember nothing
 * about a visitor's own preferences until they'd already agreed to
 * tracking, which is a worse experience for no real privacy benefit.
 */

const CONSENT_STORAGE_KEY = 'aviyana-insight-cookie-consent';

export type ConsentChoice = 'accepted' | 'rejected';

export function getStoredConsent(): ConsentChoice | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'accepted' || stored === 'rejected') return stored;
  } catch {
    // localStorage unavailable -- treat as no choice made yet.
  }
  return null;
}

export function setStoredConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Best-effort only -- the banner will just reappear next visit if this fails.
  }
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === 'accepted';
}
