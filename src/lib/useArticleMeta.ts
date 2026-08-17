import { useEffect } from 'react';

const DEFAULT_TITLE = 'Aviyana Insight | Newsroom & Investor Relations — Aviyana Ceylon Resort';
const DEFAULT_DESCRIPTION = 'The official source of truth for Aviyana Ceylon Resort: verified construction milestones, press statements, fact-checked rumor rebuttals, and investor updates.';
const DEFAULT_IMAGE = 'https://insight.aviyana.lk/og-image.png';
const SITE_URL = 'https://insight.aviyana.lk';

interface ArticleMetaOptions {
  title: string;
  description: string;
  image?: string;
  /** Path + query to set as the canonical/OG URL for this piece, e.g.
   * "/?tab=public-hub&item=abc123" -- matches the "Share Article" deep-link
   * format used elsewhere (PublicHubView's handleCopyLink, etc). */
  path: string;
}

function setMetaTag(selector: string, attr: 'content', value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Updates document.title and the page's OG/Twitter/canonical meta tags to
 * describe whatever specific article/milestone/fact-check is currently
 * open, instead of every page on the site always showing the same generic
 * homepage title and image (see index.html's static <head> tags -- those
 * are the fallback/default this hook restores on unmount).
 *
 * IMPORTANT SCOPE NOTE: this only helps two audiences -- (1) a person
 * reading in-browser, whose tab title now actually reflects what they have
 * open, and (2) crawlers that execute JavaScript before reading meta tags
 * (Googlebot does this for indexing). It does NOT fix social-preview cards
 * on Facebook/WhatsApp/Twitter/LinkedIn/Slack -- those crawlers fetch the
 * raw HTML and do not run JavaScript, so they will only ever see
 * index.html's static tags no matter what this hook changes at runtime.
 * That's what the "Share" links now point to a Netlify Function
 * (netlify/functions/share.ts) for instead, which serves each article its
 * own real static HTML with correct tags -- see that file's comment for
 * the full explanation. This hook and that function are a matched pair,
 * not alternatives to each other.
 */
export function useArticleMeta(options: ArticleMetaOptions | null) {
  useEffect(() => {
    if (!options) return;

    const fullUrl = `${SITE_URL}${options.path}`;
    const image = options.image || DEFAULT_IMAGE;
    const previousTitle = document.title;

    document.title = `${options.title} | Aviyana Insight`;
    setMetaTag('meta[name="description"]', 'content', options.description);
    setMetaTag('meta[property="og:title"]', 'content', options.title);
    setMetaTag('meta[property="og:description"]', 'content', options.description);
    setMetaTag('meta[property="og:image"]', 'content', image);
    setMetaTag('meta[property="og:url"]', 'content', fullUrl);
    setMetaTag('meta[name="twitter:title"]', 'content', options.title);
    setMetaTag('meta[name="twitter:description"]', 'content', options.description);
    setMetaTag('meta[name="twitter:image"]', 'content', image);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', fullUrl);

    return () => {
      // Restore the homepage defaults on close/unmount so the tab title and
      // meta tags don't stay stuck on the last-viewed article once someone
      // navigates away.
      document.title = previousTitle === `${options.title} | Aviyana Insight` ? DEFAULT_TITLE : previousTitle;
      setMetaTag('meta[name="description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[property="og:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[property="og:image"]', 'content', DEFAULT_IMAGE);
      setMetaTag('meta[property="og:url"]', 'content', `${SITE_URL}/`);
      setMetaTag('meta[name="twitter:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[name="twitter:description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE);
      const canonicalEl = document.head.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.setAttribute('href', `${SITE_URL}/`);
    };
  }, [options?.title, options?.description, options?.image, options?.path]);
}
