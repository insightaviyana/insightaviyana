import React from 'react';

/**
 * Extracts a YouTube video ID from any common YouTube URL shape, including
 * unlisted video links (unlisted videos use the same watch/share URL format
 * as public ones -- they just don't show up in search or on the channel page).
 * Returns null if the URL isn't a recognizable YouTube link.
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url?: string | null): boolean {
  return getYouTubeVideoId(url) !== null;
}

interface SmartVideoPlayerProps {
  url: string;
  className?: string;
  poster?: string;
  title?: string;
}

/**
 * Renders a YouTube iframe embed for YouTube links (public or unlisted --
 * unlisted is the recommended way to add videos here, since it keeps large
 * video files off this app's own storage/data entirely and just embeds
 * Google's player). Falls back to a native <video> tag for direct file URLs
 * (e.g. a locally uploaded file's temporary preview, or a direct .mp4 link).
 */
export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({ url, className, poster, title }) => {
  const youtubeId = getYouTubeVideoId(url);

  if (youtubeId) {
    return (
      <iframe
        className={className}
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title || 'YouTube video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <video controls src={url} poster={poster} className={className}>
      Your browser does not support HTML5 Video playback.
    </video>
  );
};
