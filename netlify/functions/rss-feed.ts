import type { Handler } from '@netlify/functions';

// RSS feed for the Public Hub / Press Room — Medium-term item from
// ENGINEERING_ASSESSMENT.md ("Journalists and analysts commonly track
// newsrooms via RSS or email digest rather than checking back manually").
//
// Deliberately a Netlify Function hitting Supabase's REST (PostgREST)
// endpoint directly with plain fetch(), the same "no SDK needed" approach
// as send-notification-email.ts, rather than pulling in
// @supabase/supabase-js here — an RSS reader/crawler needs a fast, static
// XML response with no client-side JS involved at all, and this avoids the
// Realtime-client/WebSocket gotcha noted in netlify.toml for functions that
// do call createClient().
//
// Uses the ANON key only (never the service role key) since this reads the
// same publicly-readable `announcements` table the React app already
// fetches from — see the "Public can read announcements" RLS policy in
// supabase-setup.sql. Only rows with status = 'Published' are included.
//
// Wired up at /rss.xml via the redirect in netlify.toml.

interface AnnouncementRow {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  date: string;
  content: string;
  tags: string[] | null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Articles store `date` as a free-text string (see ArticleItem in types.ts),
// not necessarily ISO -- RSS <pubDate> needs RFC 822. Best-effort parse;
// falls back to "now" rather than emitting an invalid feed entry.
function toRfc822(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return new Date().toUTCString();
  return parsed.toUTCString();
}

const SITE_URL = 'https://insight.aviyana.lk';

export const handler: Handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'text/plain' },
      body: 'RSS feed unavailable: Supabase is not configured on this deployment.'
    };
  }

  try {
    const query = new URLSearchParams({
      select: 'id,title,subtitle,category,author,date,content,tags',
      status: 'eq.Published',
      order: 'date.desc',
      limit: '50'
    });
    const response = await fetch(`${supabaseUrl}/rest/v1/announcements?${query.toString()}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('rss-feed: Supabase query failed:', errorText);
      return { statusCode: 502, headers: { 'Content-Type': 'text/plain' }, body: 'Could not load articles.' };
    }

    const articles = (await response.json()) as AnnouncementRow[];

    const items = articles.map(article => {
      const link = `${SITE_URL}/?tab=announcements&article=${encodeURIComponent(article.id)}`;
      // <description> is a short excerpt (subtitle), not the full body --
      // an RSS reader/crawler linking back to the article is exactly the
      // "credible, easy to cite, easy to share" outcome the newsroom
      // category needs, not a full-text mirror that would let readers skip
      // the source entirely.
      const description = article.subtitle || article.content.slice(0, 240);
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(article.id)}</guid>
      <pubDate>${toRfc822(article.date)}</pubDate>
      <category>${escapeXml(article.category)}</category>
      <author>${escapeXml(article.author)}</author>
      <description>${escapeXml(description)}</description>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Aviyana Insight — Newsroom &amp; Press Releases</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Official press releases, verified milestones, and executive statements from Aviyana Ceylon Resort.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        // Public press content, safe to cache briefly at the edge --
        // cuts repeated DB hits from crawlers polling the feed.
        'Cache-Control': 'public, max-age=300'
      },
      body: xml
    };
  } catch (err) {
    console.error('rss-feed error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Internal error generating RSS feed.' };
  }
};
