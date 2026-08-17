-- ------------------------------------------------------------
-- Sponsored Events -- public "who have we sponsored" showcase.
-- One event card per sponsorship, each with its own video gallery
-- (sponsored_event_media) and album-based photo gallery
-- (sponsored_event_photos) -- mirrors the education_media / education_photos
-- pattern above, just scoped to an event via event_id.
--
-- Requires public.is_staff_or_admin() from the initial schema migration.
-- Run this AFTER 00000000000000_initial_schema.sql.
--
-- Storage: cover images and gallery photos are uploaded through the
-- existing uploadContentImage() helper into the SAME 'content-images'
-- bucket every other content type already uses (folder: 'sponsored-events'
-- -- see SponsoredEventsView.tsx). That bucket's storage.objects policies
-- (00000000000000_initial_schema.sql, section 0c) are scoped to
-- bucket_id = 'content-images' only, not to any specific folder, so no new
-- storage policy is needed here -- the existing public-read /
-- staff-or-admin-write rules already cover this folder.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sponsored_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sponsor_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE sponsored_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sponsored_events" ON sponsored_events;
CREATE POLICY "Public can read sponsored_events" ON sponsored_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write sponsored_events" ON sponsored_events;
CREATE POLICY "Staff and admin can write sponsored_events" ON sponsored_events FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE TABLE IF NOT EXISTS sponsored_event_media (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES sponsored_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS sponsored_event_media_event_id_idx ON sponsored_event_media(event_id);

ALTER TABLE sponsored_event_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sponsored_event_media" ON sponsored_event_media;
CREATE POLICY "Public can read sponsored_event_media" ON sponsored_event_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write sponsored_event_media" ON sponsored_event_media;
CREATE POLICY "Staff and admin can write sponsored_event_media" ON sponsored_event_media FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE TABLE IF NOT EXISTS sponsored_event_photos (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES sponsored_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  date TEXT NOT NULL,
  -- Album grouping: same pattern as education_photos -- every photo added
  -- in one "Add Photos" batch shares an album_id/album_name so the gallery
  -- shows one card per album ("more photos" inside), not a flat photo grid.
  album_id TEXT,
  album_name TEXT,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS sponsored_event_photos_event_id_idx ON sponsored_event_photos(event_id);

ALTER TABLE sponsored_event_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sponsored_event_photos" ON sponsored_event_photos;
CREATE POLICY "Public can read sponsored_event_photos" ON sponsored_event_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write sponsored_event_photos" ON sponsored_event_photos;
CREATE POLICY "Staff and admin can write sponsored_event_photos" ON sponsored_event_photos FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
