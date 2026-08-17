-- Aviyana Insight — Executives table migration
-- Run this once in the Supabase Dashboard's SQL Editor (Project > SQL Editor > New query).
-- Safe to run even if it's already been applied -- uses IF NOT EXISTS / DROP POLICY IF EXISTS.

CREATE TABLE IF NOT EXISTS executives (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE executives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read executives" ON executives;
CREATE POLICY "Public can read executives" ON executives FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write executives" ON executives;
CREATE POLICY "Staff and admin can write executives" ON executives FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- Optional: seed the three executives already shown on the Press Kit page
-- so it isn't empty after this migration. Staff can edit/replace these
-- from the Press Kit page once the app is redeployed. Skip this block if
-- you'd rather add them manually through the UI instead.
INSERT INTO executives (id, name, title, avatar_url, display_order) VALUES
  ('exec-1', 'Dr. Thisara Hewawasam', 'Chairman & Founder', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', 1),
  ('exec-2', 'Heshan', 'PR & Media Communications Specialist', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80', 2),
  ('exec-3', 'Ishan Ekanayake', 'SE — Technical Lead & Web Architect', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', 3)
ON CONFLICT (id) DO NOTHING;
