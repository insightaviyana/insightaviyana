-- Aviyana Insight — Newsletter Subscribers migration
-- Run this once in the Supabase Dashboard's SQL Editor (Project > SQL Editor > New query).
-- Safe to run even if it's already been applied.
-- Requires the enforce_insert_rate_limit() function, which already exists from earlier
-- migrations (used by inquiries/registrations/notifications) -- if this is a brand new
-- project that hasn't run supabase-setup.sql at all yet, run that first instead.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and admin can view subscribers" ON newsletter_subscribers;
CREATE POLICY "Staff and admin can view subscribers" ON newsletter_subscribers FOR SELECT
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can delete subscribers" ON newsletter_subscribers;
CREATE POLICY "Staff and admin can delete subscribers" ON newsletter_subscribers FOR DELETE
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Anyone can upsert their own subscription" ON newsletter_subscribers;
CREATE POLICY "Anyone can upsert their own subscription" ON newsletter_subscribers FOR UPDATE
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS newsletter_subscribers_rate_limit ON newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_rate_limit BEFORE INSERT ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_insert_rate_limit(20);
