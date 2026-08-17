import React from 'react';
import { ShieldCheck, BadgeCheck, History, Mail, ScrollText, Users } from 'lucide-react';
import { Executive } from '../types';

interface EditorialStandardsViewProps {
  executives: Executive[];
  onOpenQuestionModal?: () => void;
}

/**
 * The credibility page a site branded as "official source of truth" needs
 * but was missing entirely -- who runs this newsroom, how a claim actually
 * gets verified before it's published, and what happens when something
 * needs correcting after the fact. Deliberately NOT in the main Navbar
 * (see the mobile bottom-bar scrolling fix in Navbar.tsx -- adding an 9th
 * public tab there just for this would be the wrong trade-off for a page
 * most visitors only need once); reached instead from the site Footer
 * (every page) and a link on the Press Kit page, which is the more natural
 * "I'm here to evaluate this newsroom's credibility" entry point.
 */
export const EditorialStandardsView: React.FC<EditorialStandardsViewProps> = ({ executives, onOpenQuestionModal }) => {
  const masthead = [...executives].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      <div className="hero-band bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck size={16} />
          <span>Editorial Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white max-w-2xl">
          How Aviyana Insight Verifies, Publishes, and Corrects
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Aviyana Insight (insight.aviyana.lk) is the official source-of-truth channel for Aviyana Ceylon Resort -- run directly by resort management, not a third-party news outlet. This page explains how we work, so anyone checking a claim against this site knows exactly what "verified" means here.
        </p>
      </div>

      {/* Masthead */}
      <section>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Users size={16} />
          <span>Masthead</span>
        </div>
        {masthead.length === 0 ? (
          <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">
            Masthead details are being updated. Contact insight@aviyana.lk for the current editorial leadership.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {masthead.map(exec => (
              <div key={exec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <img
                  src={exec.avatarUrl}
                  alt={exec.name}
                  className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{exec.name}</div>
                  <div className="text-xs text-amber-300 truncate">{exec.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How we verify */}
      <section>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <BadgeCheck size={16} />
          <span>How We Verify a Claim</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-sm text-slate-300">
          <p>
            Every entry on the <strong className="text-white">Fact-Check Portal</strong> pairs a specific rumor or claim with our official response and, wherever one exists, a linked source document -- a government clearance certificate, a signed statement, or another primary record. We don't publish a "fact" without pointing to what it's based on.
          </p>
          <p>
            Construction and CEA milestones on the Public Hub carry a <strong className="text-white">"Verified By"</strong> credit naming the person or office who confirmed it, not just an anonymous status change.
          </p>
          <p>
            Staff-submitted articles and fact-checks go through an admin review step before publishing (see the "Pending Admin Approval" status shown on any post that hasn't cleared it yet) -- nothing goes live from a single person's draft without a second set of eyes.
          </p>
        </div>
      </section>

      {/* Corrections policy */}
      <section>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <History size={16} />
          <span>Corrections Policy</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-sm text-slate-300">
          <p>
            When a published article, milestone, or fact-check is edited after it first went live, the piece shows an <strong className="text-white">"Updated on &lt;date&gt;"</strong> badge next to its original publish date. We don't silently rewrite something and leave the original publish date as the only timestamp -- if you see that badge, the content has genuinely changed since it first appeared.
          </p>
          <p>
            If you believe something on this site is inaccurate, please tell us directly rather than relying on a third-party repost -- use the button below or email <a href="mailto:insight@aviyana.lk" className="text-amber-300 hover:underline font-mono">insight@aviyana.lk</a>. We review every correction request and update the record accordingly.
          </p>
        </div>
      </section>

      {/* Ownership & funding transparency */}
      <section>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <ScrollText size={16} />
          <span>Ownership &amp; Independence</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm text-slate-300">
          <p>
            Aviyana Insight is owned and operated by Aviyana Ceylon Resort. It is <strong className="text-white">not an independent press outlet</strong> -- it exists specifically to publish verified, first-party information directly from resort management (construction progress, investor updates, official statements, and rebuttals to inaccurate claims circulating elsewhere). We aim to be accurate and transparent about that role rather than presenting ourselves as neutral third-party journalism.
          </p>
        </div>
      </section>

      {onOpenQuestionModal && (
        <section className="hero-band bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/30 rounded-2xl p-6 text-center">
          <Mail size={28} className="text-amber-400 mx-auto mb-2" />
          <h3 className="text-lg font-serif font-bold text-white">Spotted something that needs correcting?</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Send it directly to our editorial team -- every request is logged and reviewed by a real person.
          </p>
          <button
            onClick={onOpenQuestionModal}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg inline-flex items-center gap-1.5"
          >
            <Mail size={14} />
            <span>Request a Correction</span>
          </button>
        </section>
      )}
    </div>
  );
};
