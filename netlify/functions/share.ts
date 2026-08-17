import type { Handler } from '@netlify/functions';

// Fixes the #1 finding from the News Editor audit: this is a client-side
// SPA, so index.html's <meta> tags are static and identical for every
// page. When someone shared a specific article link, Facebook/WhatsApp/
// Twitter/LinkedIn/Slack always showed the generic homepage title and
// image, never the actual story -- because those platforms' link-preview
// crawlers fetch the raw HTML only and do NOT execute JavaScript, so
// src/lib/useArticleMeta.ts's runtime tag updates (which DO work for a
// human's browser tab, and for Googlebot, which does render JS) are
// invisible to them.
//
// This function is the actual fix for that: a static Netlify Function,
// hit at /share?type=article&id=<id> (see netlify.toml), that fetches just
// that one item from Supabase and returns real, static HTML with correct
// OG/Twitter meta tags baked in -- no JS execution required to see them.
// A real visitor's browser is bounced into the actual SPA immediately
// (both a <meta http-equiv="refresh"> for no-JS clients and a <script>
// redirect for the near-instant case), landing on the same `?item=`
// deep link PublicHubView already knows how to auto-open (see its
// `sharedLinkHandled` effect) -- so a human never actually sees this raw
// HTML page, only crawlers that stop after the initial fetch do.
//
// Same "no SDK needed" pattern as rss-feed.ts / sitemap.ts: plain fetch()
// against Supabase's REST endpoint with the anon key, not
// @supabase/supabase-js (see rss-feed.ts's comment on why, re: the
// Realtime-client/WebSocket gotcha noted in netlify.toml).

const SITE_URL = 'https://insight.aviyana.lk';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface AnnouncementRow {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  cover_image_url: string | null;
  status: string;
  scheduled_publish_at: string | null;
}

interface MilestoneRow {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  status: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(opts: { title: string; description: string; image: string; redirectTo: string }): string {
  const { title, description, image, redirectTo } = opts;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(`${SITE_URL}${redirectTo}`);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectTo)}" />
  <title>${safeTitle} | Aviyana Insight</title>
  <meta name="description" content="${safeDescription}" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Aviyana Insight" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <link rel="canonical" href="${safeUrl}" />
  <script>window.location.replace(${JSON.stringify(redirectTo)});</script>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(redirectTo)}">Aviyana Insight</a>&hellip;</p>
</body>
</html>`;
}

export const handler: Handler = async (event) => {
  const type = event.queryStringParameters?.type;
  const id = event.queryStringParameters?.id;
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' };

  if (!id || (type !== 'article' && type !== 'milestone')) {
    // Malformed share link -- just send them to the homepage rather than
    // erroring; this only happens from a hand-edited URL, not a real
    // "Share" button, which always builds a well-formed one.
    return { statusCode: 302, headers: { Location: `${SITE_URL}/` }, body: '' };
  }

  const redirectTo = `/?tab=public-hub&item=${encodeURIComponent(id)}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    // Not configured -- still redirect a real visitor into the SPA; they
    // just won't get a rich preview if shared from this state (same as
    // every other Supabase-dependent feature when unconfigured).
    return { statusCode: 200, headers: htmlHeaders, body: renderPage({ title: 'Aviyana Insight', description: 'Aviyana Ceylon Resort — official source of truth.', image: DEFAULT_IMAGE, redirectTo }) };
  }

  try {
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

    if (type === 'article') {
      const query = new URLSearchParams({ select: 'id,title,subtitle,content,cover_image_url,status,scheduled_publish_at', id: `eq.${id}`, limit: '1' });
      const res = await fetch(`${supabaseUrl}/rest/v1/announcements?${query.toString()}`, { headers });
      const rows = res.ok ? ((await res.json()) as AnnouncementRow[]) : [];
      const row = rows[0];
      // Same visibility rule as src/lib/contentVisibility.ts's
      // isPubliclyVisible() -- reimplemented here since this function can't
      // import frontend TS. Not found, still a Draft/In Review, OR still
      // embargoed (scheduled_publish_at in the future) all get the same
      // treatment: don't leak the title/content into a public preview
      // card before it's actually meant to be public. Redirect to the
      // homepage instead.
      const isPubliclyVisible = row && row.status === 'Published' &&
        (!row.scheduled_publish_at || new Date(row.scheduled_publish_at) <= new Date());
      if (!row || !isPubliclyVisible) {
        return { statusCode: 302, headers: { Location: `${SITE_URL}/` }, body: '' };
      }
      const description = row.subtitle || row.content.slice(0, 200);
      return {
        statusCode: 200,
        headers: htmlHeaders,
        body: renderPage({ title: row.title, description, image: row.cover_image_url || DEFAULT_IMAGE, redirectTo })
      };
    } else {
      const query = new URLSearchParams({ select: 'id,title,description,image_url,status', id: `eq.${id}`, limit: '1' });
      const res = await fetch(`${supabaseUrl}/rest/v1/milestones?${query.toString()}`, { headers });
      const rows = res.ok ? ((await res.json()) as MilestoneRow[]) : [];
      const row = rows[0];
      if (!row) {
        return { statusCode: 302, headers: { Location: `${SITE_URL}/` }, body: '' };
      }
      return {
        statusCode: 200,
        headers: htmlHeaders,
        body: renderPage({ title: row.title, description: row.description, image: row.image_url || DEFAULT_IMAGE, redirectTo })
      };
    }
  } catch (err) {
    console.error('share function error:', err);
    return { statusCode: 302, headers: { Location: `${SITE_URL}/` }, body: '' };
  }
};
