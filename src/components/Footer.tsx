import React from 'react';
import { ShieldCheck, Rss, Mail } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
  onOpenQuestionModal?: () => void;
}

/**
 * Minimal site-wide footer -- previously the app had no footer at all, so
 * the Editorial Standards page (masthead, verification methodology,
 * corrections policy) had no discoverable link anywhere on the site once
 * it existed. Deliberately small: this isn't a sitemap dump of every tab
 * (that's what the Navbar is for), just the handful of "credibility /
 * where do I go to check this outlet out" links a newsroom footer
 * conventionally carries.
 */
export const Footer: React.FC<FooterProps> = ({ onNavigateTab, onOpenQuestionModal }) => {
  return (
    <footer className="border-t border-slate-800 mt-12 mb-16 lg:mb-0">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <button
            onClick={() => onNavigateTab('editorial-standards')}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          >
            <ShieldCheck size={13} />
            <span>Editorial Standards</span>
          </button>
          <a href="/rss.xml" className="flex items-center gap-1.5 hover:text-amber-300 transition-colors">
            <Rss size={13} />
            <span>RSS Feed</span>
          </a>
          {onOpenQuestionModal && (
            <button onClick={onOpenQuestionModal} className="flex items-center gap-1.5 hover:text-amber-300 transition-colors">
              <Mail size={13} />
              <span>Contact / Corrections</span>
            </button>
          )}
        </div>
        <div className="text-[11px] text-slate-500 font-mono text-center sm:text-right flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="font-signature text-sm text-slate-400 tracking-wide">Aviyana Ceylon Resort</span>
          <span>&middot; insight.aviyana.lk</span>
        </div>
      </div>
    </footer>
  );
};
