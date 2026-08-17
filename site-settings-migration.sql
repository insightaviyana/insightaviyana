-- Aviyana Insight — Site Settings migration
-- Run this once in the Supabase Dashboard's SQL Editor (Project > SQL Editor > New query).
-- Safe to run even if it's already been applied.

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site_settings" ON site_settings;
CREATE POLICY "Public can read site_settings" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write site_settings" ON site_settings;
CREATE POLICY "Staff and admin can write site_settings" ON site_settings FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
