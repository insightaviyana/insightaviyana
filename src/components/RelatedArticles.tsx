import React from 'react';
import { Newspaper } from 'lucide-react';
import { ArticleItem } from '../types';
import { isPubliclyVisible } from '../lib/contentVisibility';

interface RelatedArticlesProps {
  articles: ArticleItem[];
  current: ArticleItem;
  onSelect: (article: ArticleItem) => void;
  /** Max cards to show. Default 3. */
  count?: number;
}

/**
 * "Related Stories" -- shown at the bottom of an article reader so a
 * finished reader has somewhere to go next instead of a dead end. Prefers
 * other Published articles in the same category (most recent first);
 * if there aren't enough of those, backfills with the most recent other
 * Published articles regardless of category so the section still has
 * something to show rather than disappearing the moment a category is
 * thin. Never suggests the current article itself, and never suggests
 * anything not publicly visible (a Draft or a still-embargoed scheduled
 * article) -- a reader has no way to open a piece that isn't public yet.
 */
export const RelatedArticles: React.FC<RelatedArticlesProps> = ({ articles, current, onSelect, count = 3 }) => {
  const candidates = articles.filter(a => a.id !== current.id && isPubliclyVisible(a));
  const sameCategory = candidates
    .filter(a => a.category === current.category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const rest = candidates
    .filter(a => a.category !== current.category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const related = [...sameCategory, ...rest].slice(0, count);

  if (related.length === 0) return null;

  return (
    <div className="pt-5 mt-5 border-t border-slate-800">
      <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
        <Newspaper size={14} />
        <span>Related Stories</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map(article => (
          <button
            key={article.id}
            type="button"
            onClick={() => onSelect(article)}
            className="text-left group bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl overflow-hidden transition-all"
          >
            {article.coverImageUrl && (
              <div className="aspect-video overflow-hidden bg-black">
                <img
                  loading="lazy"
                  src={article.coverImageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="p-2.5">
              <div className="text-[9px] font-mono text-amber-400/90 uppercase">{article.category}</div>
              <h5 className="text-xs font-post font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mt-0.5">
                {article.title}
              </h5>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
