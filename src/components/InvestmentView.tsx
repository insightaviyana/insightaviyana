import React, { useState } from 'react';
import { TrendingUp, ShieldCheck, FileText, HelpCircle, ArrowRight, PlayCircle, Mail, X, Calendar, Plus, Pencil, Trash2, Calculator } from 'lucide-react';
import { ArticleItem, FactCheckItem } from '../types';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { ArticleContentRenderer } from './ArticleContentRenderer';
import { isPubliclyVisible } from '../lib/contentVisibility';
import { UpdatedBadge } from './UpdatedBadge';
import { RelatedArticles } from './RelatedArticles';

interface InvestmentViewProps {
  articles: ArticleItem[];
  factChecks: FactCheckItem[];
  onOpenQuestionModal: () => void;
  isStaffAuthenticated?: boolean;
  onRequestNewArticle?: () => void;
  onRequestEditArticle?: (articleId: string) => void;
  onDeleteArticle?: (articleId: string) => void;
  onArticleViewed?: (articleId: string) => void;
}

/**
 * Dedicated public page for investment-related content: pulls together
 * "Investor Update" articles, "Investment & Financial" fact-checks, and an
 * inquiry CTA, rather than making a prospective investor dig through the
 * general news feed and fact-check tab separately. Has its own small
 * article reader modal (rather than routing through AnnouncementsView's)
 * to keep this page self-contained. Creating/editing an article still
 * happens via AnnouncementsView's composer -- this page just opens it
 * pre-filled, rather than duplicating a second article-writing UI.
 */
export const InvestmentView: React.FC<InvestmentViewProps> = ({
  articles,
  factChecks,
  onOpenQuestionModal,
  isStaffAuthenticated = false,
  onRequestNewArticle,
  onRequestEditArticle,
  onDeleteArticle,
  onArticleViewed
}) => {
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  // Staff see their own "In Review" investor posts here too (so they can
  // track/edit/delete a pending submission), same as AnnouncementsView --
  // a public visitor only ever sees ones that are actually Published.
  const investorArticles = articles
    .filter(a => a.category === 'Investor Update' && (isPubliclyVisible(a) || isStaffAuthenticated))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const investmentFactChecks = factChecks.filter(f => f.category === 'Investment & Financial');

  // The hero video is simply the newest Investor Update article that has a
  // video attached -- no separate "featured video" field/table needed, this
  // just reuses the video an admin already attached when publishing.
  const heroVideoArticle = investorArticles.find(a => a.videoUrl && isPubliclyVisible(a));

  const handleDelete = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (!onDeleteArticle) return;
    if (window.confirm('Remove this investor update? This cannot be undone.')) {
      onDeleteArticle(articleId);
      if (selectedArticle?.id === articleId) setSelectedArticle(null);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Hero */}
      <div className="hero-band bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <TrendingUp size={16} />
          <span>Invest in Aviyana Ceylon Resort</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white max-w-2xl">
          Official Investor Information & Verified Financial Updates
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Every figure and offer referenced here is published directly by Aviyana Ceylon Resort management, with supporting documentation available on request. If you've seen a claim about our investment terms elsewhere, check it against the fact-checks below before acting on it.
        </p>

      </div>

      {/* Investor Update articles -- posts come first, ahead of the video
          and calculator, per the requested reading order (articles/posts ->
          videos -> ROI calculator -> FAQ). */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <FileText size={16} />
            <span>Investor Updates</span>
          </div>
          {isStaffAuthenticated && onRequestNewArticle && (
            <button
              onClick={onRequestNewArticle}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md"
            >
              <Plus size={13} />
              <span>Publish Investment Update</span>
            </button>
          )}
        </div>

        {investorArticles.length === 0 ? (
          <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">
            No investor updates published yet. Check back soon, or use the button below to ask a question directly.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {investorArticles.map(article => (
              <div
                key={article.id}
                onClick={() => { setSelectedArticle(article); onArticleViewed?.(article.id); }}
                className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all"
              >
                {article.coverImageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono text-amber-400">{article.date}</div>
                    {article.status !== 'Published' && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/40">
                        ⏳ {article.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-serif font-bold text-white mt-1 group-hover:text-amber-300 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.subtitle}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                      <span>Read update</span>
                      <ArrowRight size={12} />
                    </div>
                    {isStaffAuthenticated && (
                      <div className="flex items-center gap-1">
                        {onRequestEditArticle && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRequestEditArticle(article.id); }}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        {onDeleteArticle && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, article.id)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-900 text-red-400 border border-red-500/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Investor Video */}
      <section>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <PlayCircle size={16} />
          <span>Featured Investor Video</span>
        </div>
        {heroVideoArticle ? (
          <div className="rounded-2xl overflow-hidden border border-amber-500/20 bg-black aspect-video max-h-[420px] flex items-center justify-center">
            <SmartVideoPlayer
              url={heroVideoArticle.videoUrl!}
              className="max-w-full max-h-full w-full h-full object-contain mx-auto"
              poster={heroVideoArticle.coverImageUrl}
              title={heroVideoArticle.title}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
            <PlayCircle size={16} />
            <span>No investor video published yet -- attach a video to an "Investor Update" post to feature it here.</span>
          </div>
        )}
      </section>

      {/* ROI Calculator -- interactive, real-time computed from actual terms:
          20% return paid at the 1-year mark, LKR 5,000,000 minimum investment. */}
      <ROICalculatorSection onOpenQuestionModal={onOpenQuestionModal} />

      {/* Fact-Checks / FAQ: address the rumors, last before the contact CTA */}
      {investmentFactChecks.length > 0 && (
        <section>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={16} />
            <span>Verified Facts on Our Investment Terms</span>
          </div>
          <div className="space-y-3">
            {investmentFactChecks.map(fc => (
              <div key={fc.id} className="p-4 rounded-xl bg-slate-900 border border-amber-500/20">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 shrink-0 mt-0.5">Claim</span>
                  <p className="text-xs text-slate-300">{fc.rumor}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">Fact</span>
                  <p className="text-xs text-white font-medium">{fc.fact}</p>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">Source: {fc.officialSource} • Verified {fc.verifiedDate}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inquiry CTA */}
      <section className="hero-band bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/30 rounded-2xl p-6 text-center">
        <HelpCircle size={28} className="text-amber-400 mx-auto mb-2" />
        <h3 className="text-lg font-serif font-bold text-white">Have a question about investing with us?</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Send it directly to our team at insight@aviyana.lk -- every inquiry is logged and answered by a real person.
        </p>
        <button
          onClick={onOpenQuestionModal}
          className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg inline-flex items-center gap-1.5"
        >
          <Mail size={14} />
          <span>Ask an Investment Question</span>
        </button>
      </section>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" onClick={() => setSelectedArticle(null)}>
          <div
            className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedArticle.videoUrl ? (
                <div className="aspect-video bg-black">
                  <SmartVideoPlayer url={selectedArticle.videoUrl} className="w-full h-full" poster={selectedArticle.coverImageUrl} title={selectedArticle.title} />
                </div>
              ) : selectedArticle.coverImageUrl ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={selectedArticle.coverImageUrl}
                  alt={selectedArticle.title}
                  className="w-full aspect-video object-contain bg-black"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/80 text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mb-2">
                <Calendar size={12} />
                <span>{selectedArticle.date}</span>
                {selectedArticle.status !== 'Published' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/40">
                    ⏳ {selectedArticle.status}
                  </span>
                )}
                <UpdatedBadge lastEditedAt={selectedArticle.lastEditedAt} />
              </div>
              <h2 className="text-xl font-serif font-bold text-white">{selectedArticle.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{selectedArticle.subtitle}</p>
              <div className="mt-4 text-sm text-slate-200">
                <ArticleContentRenderer content={selectedArticle.content} className="space-y-4" />
              </div>
              <RelatedArticles
                articles={articles}
                current={selectedArticle}
                onSelect={(article) => { setSelectedArticle(article); onArticleViewed?.(article.id); }}
              />
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Published by {selectedArticle.author} ({selectedArticle.authorRole})
                </span>
                {isStaffAuthenticated && (
                  <div className="flex items-center gap-1.5">
                    {onRequestEditArticle && (
                      <button
                        onClick={() => onRequestEditArticle(selectedArticle.id)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>
                    )}
                    {onDeleteArticle && (
                      <button
                        onClick={(e) => handleDelete(e, selectedArticle.id)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-red-900 text-red-400 border border-red-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ROI Calculator ---------------------------------------------------
// A dedicated, self-contained section so InvestmentView's main component
// stays readable. Real terms, not illustrative: 20% return paid at the
// 1-year mark, LKR 5,000,000 minimum investment -- both hardcoded here
// since they're fixed program terms, not derived from any live data.

const MIN_INVESTMENT = 5_000_000;
const ANNUAL_RETURN_RATE = 0.20;
const MAX_SLIDER = 100_000_000;

const formatLKR = (n: number) =>
  new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Math.round(n));

const ROICalculatorSection: React.FC<{ onOpenQuestionModal: () => void }> = ({ onOpenQuestionModal }) => {
  const [amount, setAmount] = useState(MIN_INVESTMENT);
  const belowMinimum = amount < MIN_INVESTMENT;
  const profit = amount * ANNUAL_RETURN_RATE;
  const total = amount + profit;

  // Position of the principal/profit split as a percentage, for the visual bar.
  const principalPct = (amount / total) * 100;

  return (
    <section className="hero-band relative overflow-hidden bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Calculator size={16} />
          <span>Investor Return Calculator</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white max-w-2xl">
          See What a Stake in Aviyana Ceylon Could Return
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Our current program pays a <strong className="text-amber-300">20% return, paid out at the 1-year mark</strong>, on a minimum investment of <strong className="text-amber-300">LKR {formatLKR(MIN_INVESTMENT)}</strong>. Move the slider to see your own numbers.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Slider + input */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label htmlFor="inv-amount" className="block text-xs font-semibold text-slate-400 mb-2">Your Investment Amount (LKR)</label>
              <input
                id="inv-amount"
                type="number"
                min={0}
                step={100000}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-4 py-3 bg-slate-950 border border-amber-500/30 rounded-xl text-xl font-serif font-bold text-white focus:outline-none focus:border-amber-400"
              />
              <input
                type="range"
                aria-label="Investment amount slider"
                min={0}
                max={MAX_SLIDER}
                step={100000}
                value={Math.min(amount, MAX_SLIDER)}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mt-3 accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0</span>
                <span>LKR {formatLKR(MAX_SLIDER)}+</span>
              </div>
            </div>

            {belowMinimum && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2.5">
                The minimum investment is <strong>LKR {formatLKR(MIN_INVESTMENT)}</strong>. Figures below assume the minimum until you reach it.
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 space-y-5">
              {/* Principal vs Profit visual bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span>Your Principal</span>
                  <span>Your Return (20%)</span>
                </div>
                <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-800">
                  <div className="h-full bg-slate-600" style={{ width: `${Math.max(belowMinimum ? (MIN_INVESTMENT / (MIN_INVESTMENT * 1.2)) * 100 : principalPct, 5)}%` }} />
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 flex-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wide">Your Investment</div>
                  <div className="text-xl font-serif font-bold text-white mt-0.5">
                    LKR {formatLKR(Math.max(amount, MIN_INVESTMENT))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-amber-300 uppercase tracking-wide">Return After 1 Year</div>
                  <div className="text-xl font-serif font-bold text-amber-300 mt-0.5">
                    + LKR {formatLKR(belowMinimum ? MIN_INVESTMENT * ANNUAL_RETURN_RATE : profit)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">Total Payout at 1 Year</div>
                <div className="text-3xl font-serif font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent mt-1">
                  LKR {formatLKR(belowMinimum ? MIN_INVESTMENT * (1 + ANNUAL_RETURN_RATE) : total)}
                </div>
              </div>

              <button
                onClick={onOpenQuestionModal}
                className="w-full mt-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Start an Investment Inquiry</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-6 max-w-2xl">
          This calculator illustrates the published 20% / 1-year return program and is not a guarantee, offer, or solicitation. Terms, minimums, and eligibility are confirmed directly with our Investor Relations team before any commitment.
        </p>
      </div>
    </section>
  );
};
