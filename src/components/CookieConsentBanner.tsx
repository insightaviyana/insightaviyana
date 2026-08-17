import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { getStoredConsent, setStoredConsent } from '../lib/cookieConsent';
import { initAnalytics } from '../lib/analytics';

/**
 * Bottom-fixed cookie consent banner. Shown once, on first visit, until the
 * visitor explicitly accepts or rejects — after that their choice is
 * remembered (see cookieConsent.ts) and the banner never shows again on
 * this browser. Accepting immediately starts analytics (see
 * initAnalytics()'s consent gate in analytics.ts); rejecting leaves it
 * permanently off for this visitor.
 */
export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no choice has been recorded yet -- checked once on
    // mount, not on every render.
    if (getStoredConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setStoredConsent('accepted');
    initAnalytics();
    setVisible(false);
  };

  const handleReject = () => {
    setStoredConsent('rejected');
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-5"
    >
      <div className="max-w-3xl mx-auto bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Cookie size={18} />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-white">Cookie Preferences</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              We use essential cookies to run this site, and optional analytics cookies to understand
              which press releases and updates get read. You can accept or reject the optional ones —
              essential site functionality works either way.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all"
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            aria-label="Dismiss (same as reject)"
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors sm:hidden"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
