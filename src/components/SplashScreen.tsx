import React from 'react';
import aviyanaLogoMark from '../assets/aviyana-logo-mark.png';

/**
 * Branded loading animation shown during the initial data fetch, before
 * PublicHubSkeleton takes over the actual content-shaped skeleton -- this
 * is the very first thing a visitor sees on page load, so it's the resort
 * logo with a gentle pulse/glow rather than a bare spinner. Capped at a
 * hard 5-second maximum in App.tsx (see splashTimeoutDone) regardless of
 * how long the real data fetch takes -- a visitor should never be stuck
 * staring at a loading animation indefinitely on a slow connection; after
 * 5s the app shows itself (falling back to the content-shaped skeleton for
 * anything still loading) rather than the branded splash.
 */
export const SplashScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl animate-pulse" />
      <img
        src={aviyanaLogoMark}
        alt="Aviyana Ceylon Resort"
        className="relative w-20 h-20 object-contain animate-[splashFloat_2.2s_ease-in-out_infinite]"
      />
    </div>
    <div className="flex flex-col items-center gap-2">
      <p className="font-signature text-xl text-white tracking-wide">Aviyana Insight</p>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[splashDot_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);
