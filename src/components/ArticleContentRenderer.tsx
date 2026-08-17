import React, { useState } from 'react';
import { X } from 'lucide-react';
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
 *
 * Inline images are click-to-zoom (a full-size lightbox overlay) -- the
 * `max-h-[32rem] object-contain` box below is deliberately capped for
 * layout reasons, which meant a detailed photo (e.g. a document scan or a
 * wide architectural render) was hard to actually read at its rendered
 * size. State lives here, self-contained, rather than needing every
 * calling page to wire up its own lightbox.
 */
interface ArticleContentRendererProps {
  content: string;
  className?: string;
}

export const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({ content, className = '' }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className={className}>
      {content.split('\n\n').map((paragraph, idx) => {
        const trimmed = paragraph.trim();

        if (trimmed.startsWith('[IMAGE:') && trimmed.includes(']')) {
          const imgUrl = trimmed.substring(trimmed.indexOf('[IMAGE:') + 7, trimmed.indexOf(']')).trim();
          const caption = trimmed.substring(trimmed.indexOf(']') + 1).trim();
          return (
            <div key={idx} className="my-4 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 p-2 shadow-lg">
              <button
                type="button"
                onClick={() => setLightboxUrl(imgUrl)}
                className="w-full cursor-zoom-in"
                aria-label={`View full size: ${caption || 'article image'}`}
              >
                <img loading="lazy" src={imgUrl} alt={caption || 'Article attachment'} className="w-full max-h-[32rem] object-contain rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </button>
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

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700"
          >
            <X size={20} />
          </button>
          <img src={lightboxUrl} alt="Full size preview" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
