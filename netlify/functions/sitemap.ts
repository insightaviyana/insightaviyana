import type { Handler } from '@netlify/functions';

// Dynamic sitemap.xml -- News Editor audit finding: search engines had no
// way to discover what pages exist on this site at all (no sitemap, no
// robots.txt). Mirrors rss-feed.ts's approach exactly: a Netlify Function
// hitting Supabase's REST (PostgREST) endpoint directly with plain
// fetch(), no @supabase/supabase-js, so this stays a fast static XML
// response with no client-side JS involved -- see rss-feed.ts's comment
// for why that matters for a crawler.
//
// Includes every static public tab (as this SPA's `?tab=` URLs -- see
// App.tsx's PUBLIC_TAB_IDS whitelist, which this list is deliberately kept
// in sync with) plus every publicly-visible article and milestone as its
// own deep-linkable URL (`?tab=public-hub&item=<id>`, matching the
// existing "Share Article" link format from PublicHubView.tsx).
//
// Wired up at /sitemap.xml via the redirect in netlify.toml, and
// referenced from public/robots.txt.

const SITE_URL = 'https://insight.aviyana.lk';

// Keep in sync with App.tsx's PUBLIC_TAB_IDS -- these are the only tabs a
// bare URL should ever be able to reach (see QA_AUDIT_REPORT.md's Bug #1),
// so they're also the only ones worth listing for a crawler.
const STATIC_PUBLIC_PATHS = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/?tab=announcements', changefreq: 'daily', priority: '0.9' },
  { path: '/?tab=education', changefreq: 'weekly', priority: '0.7' },
  { path: '/?tab=investment', changefreq: 'weekly', priority: '0.8' },
  { path: '/?tab=sponsored-events', changefreq: 'weekly', priority: '0.6' },
  { path: '/?tab=careers', changefreq: 'weekly', priority: '0.7' },
  { path: '/?tab=fact-check-portal', changefreq: 'weekly', priority: '0.8' },
  { path: '/?tab=press-kit', changefreq: 'monthly', priority: '0.6' },
  { path: '/?tab=editorial-standards', changefreq: 'monthly', priority: '0.4' }
];

interface AnnouncementRow {
  id: string;
  date: string;
  last_edited_at: string | null;
}

interface MilestoneRow {
  id: string;
  date: string;
  last_edited_at: string | null;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// <lastmod> needs W3C datetime (YYYY-MM-DD is valid per the sitemap spec).
// Articles/milestones store `date` as free text, not necessarily ISO --
// best-effort parse, falls back to just omitting <lastmod> for that URL
// rather than emitting an invalid one.
function toW3cDate(dateStr: string): string | null {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

export const handler: Handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const urlEntries: string[] = STATIC_PUBLIC_PATHS.map(({ path, changefreq, priority }) =>
    `  <url>\n    <loc>${escapeXml(SITE_URL + path)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  );

  if (supabaseUrl && anonKey) {
    try {
      const nowIso = new Date().toISOString();
      const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

      // Only publicly-visible articles: Published, and either no schedule
      // or the schedule has already passed -- same rule as
      // src/lib/contentVisibility.ts's isPubliclyVisible(), reimplemented
      // here as a PostgREST filter since this function can't import
      // frontend TS. Keep these two in sync if that logic ever changes.
      const articlesQuery = new URLSearchParams({
        select: 'id,date,last_edited_at',
        status: 'eq.Published',
        or: `(scheduled_publish_at.is.null,scheduled_publish_at.lte.${nowIso})`,
        order: 'date.desc',
        limit: '200'
      });
      const articlesRes = await fetch(`${supabaseUrl}/rest/v1/announcements?${articlesQuery.toString()}`, { headers });
      if (articlesRes.ok) {
        const rows = (await articlesRes.json()) as AnnouncementRow[];
        for (const row of rows) {
          const loc = `${SITE_URL}/?tab=public-hub&item=${encodeURIComponent(row.id)}`;
          const lastmod = toW3cDate(row.last_edited_at || row.date);
          urlEntries.push(
            `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
          );
        }
      } else {
        console.error('sitemap: articles query failed:', await articlesRes.text());
      }

      const milestonesQuery = new URLSearchParams({
        select: 'id,date,last_edited_at',
        order: 'date.desc',
        limit: '200'
      });
      const milestonesRes = await fetch(`${supabaseUrl}/rest/v1/milestones?${milestonesQuery.toString()}`, { headers });
      if (milestonesRes.ok) {
        const rows = (await milestonesRes.json()) as MilestoneRow[];
        for (const row of rows) {
          const loc = `${SITE_URL}/?tab=public-hub&item=${encodeURIComponent(row.id)}`;
          const lastmod = toW3cDate(row.last_edited_at || row.date);
          urlEntries.push(
            `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`
          );
        }
      } else {
        console.error('sitemap: milestones query failed:', await milestonesRes.text());
      }
    } catch (err) {
      // A DB hiccup shouldn't take the whole sitemap down -- fall back to
      // just the static pages listed above rather than a 500.
      console.error('sitemap: dynamic content fetch error:', err);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join('\n')}\n</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800' // 30 min -- content changes often enough that a long cache would go stale, but crawlers re-fetching every request is unnecessary
    },
    body: xml
  };
};
