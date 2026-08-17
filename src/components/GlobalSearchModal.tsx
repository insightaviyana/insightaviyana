import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Newspaper, ShieldCheck, GraduationCap, BadgeCheck } from 'lucide-react';
import { ArticleItem, Milestone, FactCheckItem, EducationCourse } from '../types';
import { isPubliclyVisible } from '../lib/contentVisibility';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleItem[];
  milestones: Milestone[];
  factChecks: FactCheckItem[];
  courses: EducationCourse[];
  /** Switches the app's active tab. For articles/milestones, also sets the
   * `?item=` deep-link query param before switching -- PublicHubView's own
   * mount effect (see its `sharedLinkHandled` ref) picks that up and
   * auto-opens the exact item, same mechanism as the "Share Article"
   * button. Fact-checks and courses land on the right tab but aren't
   * auto-opened to the exact item -- those tabs don't have an equivalent
   * deep-link listener yet (see the same scoping note on PublicHubView's
   * item-open effect). Still a large improvement over no site search at
   * all. */
  onNavigateTab: (tab: string) => void;
}

type ResultKind = 'article' | 'milestone' | 'fact-check' | 'course';

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  snippet: string;
  meta: string;
}

const KIND_ICON: Record<ResultKind, React.ComponentType<{ size?: number; className?: string }>> = {
  article: Newspaper,
  milestone: ShieldCheck,
  'fact-check': BadgeCheck,
  course: GraduationCap
};

const KIND_LABEL: Record<ResultKind, string> = {
  article: 'Article',
  milestone: 'Milestone',
  'fact-check': 'Fact-Check',
  course: 'Academy Course'
};

/**
 * Sitewide search -- previously the only search box on the entire site was
 * AnnouncementsView's own local one, scoped to just that tab's articles.
 * A journalist or visitor looking for "CEA clearance" had to already know
 * which of the site's several tabs to check first. This searches across
 * every public content type at once from a single overlay, reachable from
 * a Navbar button on every page.
 */
export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen, onClose, articles, milestones, factChecks, courses, onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      // Autofocus the moment the overlay renders -- a search box that
      // needs an extra click before you can type defeats the point of a
      // quick sitewide search.
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const out: SearchResult[] = [];

    for (const a of articles) {
      if (!isPubliclyVisible(a)) continue;
      const hay = `${a.title} ${a.subtitle} ${a.content} ${a.tags.join(' ')}`.toLowerCase();
      if (hay.includes(q)) out.push({ kind: 'article', id: a.id, title: a.title, snippet: a.subtitle, meta: `${a.category} · ${a.date}` });
    }
    for (const m of milestones) {
      const hay = `${m.title} ${m.description}`.toLowerCase();
      if (hay.includes(q)) out.push({ kind: 'milestone', id: m.id, title: m.title, snippet: m.description, meta: `${m.category} · ${m.date}` });
    }
    for (const f of factChecks) {
      if (f.approvalStatus !== 'Published') continue;
      const hay = `${f.rumor} ${f.fact}`.toLowerCase();
      if (hay.includes(q)) out.push({ kind: 'fact-check', id: f.id, title: f.rumor, snippet: f.fact, meta: `${f.category} · Verified ${f.verifiedDate}` });
    }
    for (const c of courses) {
      const hay = `${c.title} ${c.description}`.toLowerCase();
      if (hay.includes(q)) out.push({ kind: 'course', id: c.id, title: c.title, snippet: c.description, meta: `${c.category} · ${c.status}` });
    }

    return out.slice(0, 30);
  }, [query, articles, milestones, factChecks, courses]);

  const handleSelect = (result: SearchResult) => {
    if (result.kind === 'article' || result.kind === 'milestone') {
      // Same deep-link mechanism as "Share Article" -- see PublicHubView's
      // sharedLinkHandled effect, which reads this `item` param on mount.
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'public-hub');
        url.searchParams.set('item', result.id);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Best-effort only -- worst case the tab switches but doesn't
        // auto-open the exact item, still far better than nothing.
      }
      onNavigateTab('public-hub');
    } else if (result.kind === 'fact-check') {
      onNavigateTab('fact-check-portal');
    } else {
      onNavigateTab('education');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 sm:pt-28 p-4 bg-slate-950/85 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-slate-800">
          <Search size={16} className="text-amber-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, milestones, fact-checks, courses..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none py-1.5"
          />
          <button onClick={onClose} aria-label="Close search" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {query.trim().length < 2 ? (
            <div className="p-6 text-center text-xs text-slate-400">Type at least 2 characters to search across the whole site.</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No results for "{query}".</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {results.map((r) => {
                const Icon = KIND_ICON[r.kind];
                return (
                  <button
                    key={`${r.kind}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className="w-full text-left p-3.5 hover:bg-slate-800/60 transition-colors flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-amber-400/90">{KIND_LABEL[r.kind]}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{r.meta}</span>
                      </div>
                      <div className="text-sm font-semibold text-white truncate">{r.title}</div>
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{r.snippet}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
