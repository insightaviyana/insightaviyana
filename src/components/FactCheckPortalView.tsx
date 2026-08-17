import React, { useState } from 'react';
import { HelpCircle, Search, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { FactCheckItem } from '../types';
import { TranslationDict } from '../lib/i18n';

interface FactCheckPortalViewProps {
  factChecks: FactCheckItem[];
  isStaffAuthenticated?: boolean;
  onOpenDocument: (docName: string, title: string) => void;
  t?: TranslationDict;
}

/**
 * The Fact-Check & Myth vs. Reality archive, as its own dedicated tab.
 *
 * Previously this lived as a section directly inside PublicHubView -- moved
 * out because it kept growing (more fact-checks = a visibly longer Public
 * Hub page every time one was added), which is exactly the "space keeps
 * changing" complaint that also drove the photo-album work earlier. A
 * short preview now lives on the Public Hub instead (see
 * FACT_CHECK_PREVIEW_COUNT in PublicHubView.tsx) with a "View All" link
 * here, so the Public Hub's height stays predictable regardless of how
 * many fact-checks exist, while the archive itself still gets full,
 * unrestricted room to grow on its own page.
 */
export const FactCheckPortalView: React.FC<FactCheckPortalViewProps> = ({
  factChecks,
  isStaffAuthenticated,
  onOpenDocument,
  t
}) => {
  const [search, setSearch] = useState('');

  const filtered = factChecks.filter(f => {
    if (f.approvalStatus && f.approvalStatus !== 'Published') return false;
    const q = search.toLowerCase();
    return f.rumor.toLowerCase().includes(q) || f.fact.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="relative rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 shadow-2xl shadow-amber-500/5">
        <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-lg">
          {t ? t.factCheck.signatureBadge : 'Signature Feature'}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={14} />
              <span>{t ? t.factCheck.badge : 'Fact-Check Portal'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              {t ? t.factCheck.title : 'Fact-Check & Myth vs. Reality FAQ'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mt-1">
              {t ? t.factCheck.description : "Every rumor addressed with a document-backed official answer — this is the standing, publicly-verifiable rebuttal archive most resort newsrooms don't offer."}
            </p>
            {isStaffAuthenticated && (
              <p className="mt-2 text-[11px] text-slate-400 italic">
                Add, edit, or approve fact-checks from the <span className="text-amber-300 font-semibold not-italic">Fact-Check & FAQ</span> staff tab.
              </p>
            )}
          </div>

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              aria-label="Search rumors or topics"
              placeholder={t ? t.factCheck.searchPlaceholder : 'Search rumors or topics...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-amber-500/30 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-16">
          {search ? 'No fact-checks match your search.' : 'No fact-checks published yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((faq) => (
            <div
              key={faq.id}
              className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30">
                  Unverified Claim
                </span>
                <span className="text-[11px] font-mono text-amber-300">Verified: {faq.verifiedDate}</span>
              </div>

              <h4 className="text-sm font-semibold text-red-200 line-through opacity-80">
                {faq.rumor}
              </h4>

              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 size={16} />
                  <span>Verified Official Fact</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                  {faq.fact}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                  <div>
                    <strong className="text-slate-300">Official Source:</strong> {faq.officialSource}
                  </div>

                  {faq.documentProof && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDocument(faq.documentProof!, faq.rumor);
                      }}
                      className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
                    >
                      <FileText size={12} />
                      <span>View Document Evidence</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-4">
        <ShieldCheck size={13} className="text-amber-500/60" />
        <span>All entries verified against official documentation before publishing.</span>
      </div>
    </div>
  );
};
