import React from 'react';
import { SmartVideoPlayer } from './SmartVideoPlayer';

/**
 * Renders an article/post body that may contain inline [IMAGE: url] and
 * [VIDEO: url] markers (inserted by the "+ Insert Photo in Article" / "+
 * Insert Video" buttons in UnifiedContentEditor.tsx and QuickCrudModal.tsx)
 * as actual images/video players, not raw bracketed URL text.
 *
 * Previously this parsing only existed inside AnnouncementsView's own
 * article reader -- every other place that displays the same kind of
 * content (InvestmentView's investor-update reader, and any future reader)
 * either showed the literal "[IMAGE: https://...supabase.co/...]" text, or
 * would have needed to duplicate this logic by hand. Extracted here once so
 * "staff can add inline photos/videos to any article body, and they render
 * correctly wherever that article is read" holds site-wide, not just on
 * the Announcements page.
 */
interface ArticleContentRendererProps {
  content: string;
  className?: string;
}

export const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={className}>
      {content.split('\n\n').map((paragraph, idx) => {
        const trimmed = paragraph.trim();

        if (trimmed.startsWith('[IMAGE:') && trimmed.includes(']')) {
          const imgUrl = trimmed.substring(trimmed.indexOf('[IMAGE:') + 7, trimmed.indexOf(']')).trim();
          const caption = trimmed.substring(trimmed.indexOf(']') + 1).trim();
          return (
            <div key={idx} className="my-4 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 p-2 shadow-lg">
              <img loading="lazy" src={imgUrl} alt={caption || 'Article attachment'} className="w-full max-h-[32rem] object-contain rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              {caption && <p className="text-xs text-amber-300/80 italic text-center mt-2 font-serif">{caption}</p>}
            </div>
          );
        }

        if (trimmed.startsWith('[VIDEO:') && trimmed.includes(']')) {
          const videoUrl = trimmed.substring(trimmed.indexOf('[VIDEO:') + 7, trimmed.indexOf(']')).trim();
          const caption = trimmed.substring(trimmed.indexOf(']') + 1).trim();
          return (
            <div key={idx} className="my-4 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 p-2 shadow-lg aspect-video">
              <SmartVideoPlayer url={videoUrl} className="w-full h-full rounded-xl bg-black" />
              {caption && <p className="text-xs text-amber-300/80 italic text-center mt-2 font-serif">{caption}</p>}
            </div>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line leading-relaxed">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
};
