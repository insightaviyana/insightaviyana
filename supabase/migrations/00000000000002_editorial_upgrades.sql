-- ------------------------------------------------------------
-- Editorial upgrades -- "last updated" correction trail, scheduled/embargoed
-- publishing, and a real atomic view-count increment.
--
-- Run this AFTER 00000000000000_initial_schema.sql and
-- 00000000000001_sponsored_events.sql.
-- ------------------------------------------------------------

-- "Last updated" trail -- lets the public UI show "Updated on <date>" on an
-- article/milestone/fact-check that was edited after it was first
-- published, instead of only ever showing the original publish date no
-- matter how many times the content has since changed. Scoped to these
-- three tables specifically (not CSR impacts / voice cuts / courses) --
-- these are the three content types explicitly framed as "verified source
-- of truth" content (see PROJECT_SCOPE.md's Fact-Check & Myth vs Reality
-- Portal), where a reader or journalist being able to see "this was
-- corrected" matters most.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fact_checks ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;

-- Scheduled/embargoed publishing -- an article can be marked 'Published'
-- ahead of time with a future scheduled_publish_at, and the app's own
-- visibility filter (see src/lib/contentVisibility.ts) treats it as not
-- yet public until that moment passes. NULL (the default -- every existing
-- row) means "publish immediately once status is Published", i.e. today's
-- existing behavior is completely unchanged for anything that doesn't set
-- this column.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;

-- Real, atomic view-count increment -- previously views_count was set once
-- at creation (to 1) and never touched again, so the number shown next to
-- every article was permanently stale/fake. A plain client-side
-- "read then write views_count + 1" would both require a public UPDATE
-- grant on the whole announcements row (which the write policy deliberately
-- restricts to staff/admin -- see "Staff and admin can write" below) AND
-- be racy under concurrent readers. A SECURITY DEFINER function scoped to
-- ONLY this one column sidesteps both: it runs with the function owner's
-- privileges (bypassing the staff-only UPDATE policy for this narrow case
-- only), and the UPDATE ... SET views_count = views_count + 1 is a single
-- atomic statement, so concurrent readers can't stomp on each other's
-- increment.
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE announcements SET views_count = views_count + 1 WHERE id = article_id;
$$;

-- Callable by anyone (including a logged-out public visitor reading an
-- article) -- that's the whole point of a view counter. The function body
-- above is the only thing that runs with elevated privilege, and it can
-- only ever touch views_count on one row at a time, never anything else.
GRANT EXECUTE ON FUNCTION public.increment_article_views(TEXT) TO anon, authenticated;
