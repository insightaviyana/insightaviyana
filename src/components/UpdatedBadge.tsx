import React from 'react';
import { History } from 'lucide-react';

/**
 * "Updated on <date>" badge -- shown next to an article/milestone/fact-check's
 * original publish date whenever it has a `lastEditedAt` timestamp, so a
 * reader (or a journalist checking a claim) can tell a piece was genuinely
 * corrected/updated after it first went live, rather than only ever seeing
 * the original publish date no matter how many times the content has since
 * changed. See ContentContext.tsx's handleEditArticle/handleEditMilestone/
 * handleEditFactCheck, which stamp this field on every edit.
 */
export const UpdatedBadge: React.FC<{ lastEditedAt?: string; className?: string }> = ({ lastEditedAt, className }) => {
  if (!lastEditedAt) return null;
  const parsed = new Date(lastEditedAt);
  if (isNaN(parsed.getTime())) return null;
  const formatted = parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 ${className || ''}`}
      title="This content was corrected or updated after it was first published"
    >
      <History size={10} />
      <span>Updated {formatted}</span>
    </span>
  );
};
