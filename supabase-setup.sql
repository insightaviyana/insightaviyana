-- ============================================================
-- Aviyana Ceylon Resort — Supabase Database Setup (v3)
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (drops old policies/triggers before recreating them).
-- Adds since last version: profiles (real accounts), avatars storage bucket
-- ============================================================

-- ------------------------------------------------------------
-- 0. Profiles Table — one row per real Supabase Auth user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'guest', -- 'admin' | 'staff' | 'guest'
  staff_role TEXT,                            -- IT_LEAD / STORY_HUNTER / SOCIAL_MANAGER / GUEST_COORDINATOR / HOTEL_SCHOOL_CREW / null
  title TEXT,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Helper function to check admin status WITHOUT triggering RLS recursion.
-- SECURITY DEFINER makes it run with the privileges of the function owner
-- (the table owner), which bypasses RLS on the internal query below. Without
-- this, an admin policy that queries `profiles` from inside a `profiles`
-- policy causes "infinite recursion detected in policy for relation
-- profiles" — which silently breaks profile fetches (including for the
-- signed-in user's own row), causing successful logins to fall back to the
-- logged-out/guest view because the profile row could never be read.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  public.is_admin()
);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  public.is_admin()
);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Helper: is the caller a signed-in staff or admin account? Defined here
-- (early, right after is_admin) since the storage bucket policies below
-- reference it and would fail with "function does not exist" if it were
-- defined later in the script.
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type IN ('admin', 'staff')
  );
$$;

-- Auto-create a profile row whenever someone signs up (email/password, Google, or admin-created).
-- New accounts default to 'guest' unless the signup explicitly set account_type
-- (guest self-registration does this; admin-created accounts get corrected right
-- after creation by the admin-create-user Netlify Function).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, account_type, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'guest'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 0b. Avatars Storage Bucket (profile picture uploads)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 0c. Content Images Storage Bucket (milestones/CSR/voice-cut/article
-- cover images -- lets staff upload a file directly instead of having to
-- paste a URL to an already-hosted image).
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Content images are publicly accessible" ON storage.objects;
CREATE POLICY "Content images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-images');

DROP POLICY IF EXISTS "Staff and admin can upload content images" ON storage.objects;
CREATE POLICY "Staff and admin can upload content images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'content-images' AND public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can update content images" ON storage.objects;
CREATE POLICY "Staff and admin can update content images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'content-images' AND public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 0d. Resumes/CVs Storage Bucket -- candidates applying via the Careers
-- page or the Employment & Academy question form aren't signed in, so
-- INSERT has to be open to anyone (like the inquiries/registrations
-- tables). Unlike content-images, this is NOT public-read: resumes are
-- personal documents, so only staff/admin can view/download them --
-- candidates can upload but never list or read other people's files back.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;
CREATE POLICY "Anyone can upload a resume" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Staff and admin can read resumes" ON storage.objects;
CREATE POLICY "Staff and admin can read resumes" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes' AND public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 1. Announcements Table (Press Releases / Articles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  media_type TEXT,
  video_url TEXT,
  video_caption TEXT,
  status TEXT NOT NULL DEFAULT 'Published',
  views_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read announcements" ON announcements;
CREATE POLICY "Public can read announcements" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon key can write announcements" ON announcements;
DROP POLICY IF EXISTS "Staff and admin can write announcements" ON announcements;
DROP POLICY IF EXISTS "Staff and admin can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Staff and admin can update announcements" ON announcements;
DROP POLICY IF EXISTS "Staff and admin can delete announcements" ON announcements;

-- Same server-side backstop as content_pipeline below: staff can create and
-- edit their own articles freely, but only an admin's write may actually
-- set status to 'Published'. This closes the gap where the app's UI-only
-- admin check (isAdmin in AnnouncementsView) could be bypassed by calling
-- the Supabase API directly -- the previous single FOR ALL policy allowed
-- any staff/admin write with no restriction on the resulting status at all.
CREATE POLICY "Staff and admin can insert announcements" ON announcements FOR INSERT
  WITH CHECK (public.is_staff_or_admin() AND (public.is_admin() OR status <> 'Published'));
CREATE POLICY "Staff and admin can update announcements" ON announcements FOR UPDATE
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin() AND (public.is_admin() OR status <> 'Published'));
CREATE POLICY "Staff and admin can delete announcements" ON announcements FOR DELETE
  USING (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 2. Milestones Table (Resort News / Construction / CEA Clearances)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  document_url TEXT,
  document_name TEXT,
  image_url TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read milestones" ON milestones;
CREATE POLICY "Public can read milestones" ON milestones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon key can write milestones" ON milestones;
DROP POLICY IF EXISTS "Staff and admin can write milestones" ON milestones;
CREATE POLICY "Staff and admin can write milestones" ON milestones FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 3. CSR Impacts Table (Luxury Fleet / CSR Feature Cards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS csr_impacts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE csr_impacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read csr_impacts" ON csr_impacts;
CREATE POLICY "Public can read csr_impacts" ON csr_impacts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon key can write csr_impacts" ON csr_impacts;
DROP POLICY IF EXISTS "Staff and admin can write csr_impacts" ON csr_impacts;
CREATE POLICY "Staff and admin can write csr_impacts" ON csr_impacts FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 4. Voice Cuts Table (Press Statements / Executive Video Quotes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_cuts (
  id TEXT PRIMARY KEY,
  speaker_name TEXT NOT NULL,
  speaker_role TEXT NOT NULL,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  video_thumbnail TEXT NOT NULL,
  quote TEXT NOT NULL,
  video_url TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE voice_cuts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read voice_cuts" ON voice_cuts;
CREATE POLICY "Public can read voice_cuts" ON voice_cuts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon key can write voice_cuts" ON voice_cuts;
DROP POLICY IF EXISTS "Staff and admin can write voice_cuts" ON voice_cuts;
CREATE POLICY "Staff and admin can write voice_cuts" ON voice_cuts FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 5. Fact Checks & Rumors Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_checks (
  id TEXT PRIMARY KEY,
  rumor TEXT NOT NULL,
  fact TEXT NOT NULL,
  official_source TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  verified_date TEXT NOT NULL,
  document_proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Added here (not just later in the "session additions" section) because
-- the RLS policy just below references this column -- it has to exist
-- before that policy is created, or CREATE POLICY fails on a fresh database
-- with "column approval_status does not exist". The later ALTER TABLE for
-- this same column (further down) is now a harmless no-op thanks to
-- IF NOT EXISTS, kept for anyone who already ran an older version of this
-- script up to that point.
ALTER TABLE fact_checks ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'Published';
ALTER TABLE fact_checks ADD COLUMN IF NOT EXISTS created_by TEXT;

ALTER TABLE fact_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read fact_checks" ON fact_checks;
CREATE POLICY "Public can read fact_checks" ON fact_checks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon key can write fact_checks" ON fact_checks;
DROP POLICY IF EXISTS "Staff and admin can write fact_checks" ON fact_checks;
DROP POLICY IF EXISTS "Staff and admin can insert fact_checks" ON fact_checks;
DROP POLICY IF EXISTS "Staff and admin can update fact_checks" ON fact_checks;
DROP POLICY IF EXISTS "Staff and admin can delete fact_checks" ON fact_checks;

-- Same server-side backstop as content_pipeline/announcements: staff can
-- submit and edit fact-check entries freely, but only an admin's write may
-- set approval_status to 'Published' -- this is what actually enforces the
-- approval workflow (the FaqManagerView UI's "Approve & Publish" gate was
-- previously only a client-side check with nothing stopping a direct API
-- call from bypassing it).
CREATE POLICY "Staff and admin can insert fact_checks" ON fact_checks FOR INSERT
  WITH CHECK (public.is_staff_or_admin() AND (public.is_admin() OR approval_status <> 'Published'));
CREATE POLICY "Staff and admin can update fact_checks" ON fact_checks FOR UPDATE
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin() AND (public.is_admin() OR approval_status <> 'Published'));
CREATE POLICY "Staff and admin can delete fact_checks" ON fact_checks FOR DELETE
  USING (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 6. Content Pipeline Table (Media/Story Drafts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_pipeline (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  platform JSONB NOT NULL,
  media_preview_url TEXT NOT NULL,
  notes TEXT NOT NULL,
  publish_time_minutes INT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Adds the `role` column if this table already existed from an earlier
-- version of this script (CREATE TABLE IF NOT EXISTS above won't add
-- columns to an existing table).
ALTER TABLE content_pipeline ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT '';
ALTER TABLE content_pipeline ADD COLUMN IF NOT EXISTS revision_note TEXT;

ALTER TABLE content_pipeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read content_pipeline" ON content_pipeline;
CREATE POLICY "Public can read content_pipeline" ON content_pipeline FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon key can write content_pipeline" ON content_pipeline;
DROP POLICY IF EXISTS "Staff and admin can write content_pipeline" ON content_pipeline;
DROP POLICY IF EXISTS "Staff and admin can insert content_pipeline" ON content_pipeline;
DROP POLICY IF EXISTS "Staff and admin can delete content_pipeline" ON content_pipeline;
DROP POLICY IF EXISTS "Staff and admin can update content_pipeline" ON content_pipeline;

-- Split DELETE (any staff/admin, unrestricted) from INSERT/UPDATE (staff can
-- create and edit drafts freely, but only an admin's write may actually set
-- status to 'Published' -- this is a server-side backstop so the approval
-- workflow can't be bypassed by calling the Supabase API directly).
CREATE POLICY "Staff and admin can insert content_pipeline" ON content_pipeline FOR INSERT
  WITH CHECK (public.is_staff_or_admin() AND (public.is_admin() OR status <> 'Published'));
CREATE POLICY "Staff and admin can delete content_pipeline" ON content_pipeline FOR DELETE
  USING (public.is_staff_or_admin());
CREATE POLICY "Staff and admin can update content_pipeline" ON content_pipeline FOR UPDATE
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin() AND (public.is_admin() OR status <> 'Published'));

-- ------------------------------------------------------------
-- 7. Courses Table (Academy / Hospitality School Programs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructor TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  enrolled_count INT DEFAULT 0,
  badge TEXT NOT NULL,
  status TEXT NOT NULL,
  schedule TEXT NOT NULL,
  syllabus_doc_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read courses" ON courses;
CREATE POLICY "Public can read courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write courses" ON courses;
CREATE POLICY "Staff and admin can write courses" ON courses FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 8. Public Inquiries Table (contains submitter's name/email/phone --
-- NOT public-readable, unlike the content tables above. Anyone (including
-- an anonymous/logged-out visitor) can submit one; only staff/admin can
-- read, update, or delete them.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Delivered to insight@aviyana.lk',
  ticket_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS cv_file_name TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON inquiries;
CREATE POLICY "Anyone can submit an inquiry" ON inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and admin can view inquiries" ON inquiries;
CREATE POLICY "Staff and admin can view inquiries" ON inquiries FOR SELECT
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can update inquiries" ON inquiries;
CREATE POLICY "Staff and admin can update inquiries" ON inquiries FOR UPDATE
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can delete inquiries" ON inquiries;
CREATE POLICY "Staff and admin can delete inquiries" ON inquiries FOR DELETE
  USING (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 9. VIP / Press Registrations Table (also contains personal data --
-- same public-insert / staff-only-read pattern as inquiries above.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization_role TEXT NOT NULL,
  contact TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  vip_pass_code TEXT NOT NULL,
  registered_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a registration" ON registrations;
CREATE POLICY "Anyone can submit a registration" ON registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and admin can view registrations" ON registrations;
CREATE POLICY "Staff and admin can view registrations" ON registrations FOR SELECT
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can delete registrations" ON registrations;
CREATE POLICY "Staff and admin can delete registrations" ON registrations FOR DELETE
  USING (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 10. Notifications Table (internal ops alerts -- new inquiries, drafts
-- pending approval, DB write failures, etc. Staff/admin only, same as
-- inquiries/registrations -- these aren't meant for public visitors.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  severity TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  action_required TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- INSERT is open to everyone (not just staff/admin): the most common trigger
-- for a notification is a public visitor submitting an inquiry, scholarship
-- application, or registration while logged out -- if INSERT required
-- is_staff_or_admin(), those notifications would silently fail to save
-- right when they matter most. Reading/updating them stays staff/admin-only.
DROP POLICY IF EXISTS "Anyone can create a notification" ON notifications;
CREATE POLICY "Anyone can create a notification" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and admin can view notifications" ON notifications;
CREATE POLICY "Staff and admin can view notifications" ON notifications FOR SELECT
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can update notifications" ON notifications;
CREATE POLICY "Staff and admin can update notifications" ON notifications FOR UPDATE
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can delete notifications" ON notifications;
CREATE POLICY "Staff and admin can delete notifications" ON notifications FOR DELETE
  USING (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 11. Social Links Table (footer/navbar social media links -- public
-- read, staff/admin write, same pattern as the content tables.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_links (
  platform TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read social_links" ON social_links;
CREATE POLICY "Public can read social_links" ON social_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write social_links" ON social_links;
CREATE POLICY "Staff and admin can write social_links" ON social_links FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- ------------------------------------------------------------
-- 12. Aug 13 2026 session additions:
--   a) `context` column on milestones/csr_impacts -- a real, staff-written
--      free-text paragraph for the full-article reader view, replacing
--      what used to be hardcoded boilerplate text in the frontend.
--   b) `video_url` column on csr_impacts -- that section now shows real
--      guest video clips ("Guest Voices & Opening Wishes") instead of
--      stock fleet/car imagery.
--   c) activity_log table -- staff-facing audit trail of who did what.
-- ------------------------------------------------------------
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE csr_impacts ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE csr_impacts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE fact_checks ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'Published';
ALTER TABLE fact_checks ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE TABLE IF NOT EXISTS education_media (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,               -- 'Student Voice' | 'Event'
  title TEXT NOT NULL,
  person_name TEXT NOT NULL,
  person_detail TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE education_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read education_media" ON education_media;
CREATE POLICY "Public can read education_media" ON education_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write education_media" ON education_media;
CREATE POLICY "Staff and admin can write education_media" ON education_media FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE TABLE IF NOT EXISTS education_photos (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE education_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read education_photos" ON education_photos;
CREATE POLICY "Public can read education_photos" ON education_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can write education_photos" ON education_photos;
CREATE POLICY "Staff and admin can write education_photos" ON education_photos FOR ALL
  USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  actor_id UUID,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,              -- e.g. 'created', 'edited', 'deleted', 'approved', 'published', 'status changed'
  target_type TEXT NOT NULL,         -- e.g. 'Article', 'Milestone', 'Content Draft', 'User', 'Inquiry'
  target_title TEXT NOT NULL,        -- human-readable label of the thing acted on
  detail TEXT,                       -- optional extra detail (e.g. old status -> new status)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and admin can read activity_log" ON activity_log;
CREATE POLICY "Staff and admin can read activity_log" ON activity_log FOR SELECT
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and admin can write activity_log" ON activity_log;
CREATE POLICY "Staff and admin can write activity_log" ON activity_log FOR INSERT
  WITH CHECK (public.is_staff_or_admin());

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log (created_at DESC);

-- ============================================================
-- Done. Verify with:
--   SELECT * FROM profiles;
--   SELECT * FROM announcements;
--   SELECT * FROM milestones;
--   SELECT * FROM csr_impacts;
--   SELECT * FROM voice_cuts;
--   SELECT * FROM fact_checks;
--   SELECT * FROM content_pipeline;
--   SELECT * FROM courses;
--   SELECT * FROM inquiries;
--   SELECT * FROM registrations;
--   SELECT * FROM notifications;
--   SELECT * FROM activity_log;
--   SELECT * FROM social_links;
--
-- To make yourself the first admin, after signing up once through the app:
--   UPDATE profiles SET account_type = 'admin' WHERE email = 'your@email.com';
-- ============================================================

-- ============================================================
-- Rate limiting on public-insert tables (inquiries, registrations,
-- notifications) -- these have "anyone can insert" policies so public
-- visitors can submit without logging in, which also means anyone with the
-- anon key could flood them with junk rows via direct API calls. This caps
-- how many rows can land in each table per minute, across all submitters.
-- Not a full solution (a determined attacker could still spread requests
-- out over time), but it stops basic flooding/spam scripts. SECURITY
-- DEFINER so the count query bypasses RLS -- otherwise an anonymous
-- inserter (who has no SELECT policy on these staff-only-readable tables)
-- would fail the count check itself.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_insert_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_per_minute INT := TG_ARGV[0]::INT;
  recent_count INT;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I WHERE created_at > NOW() - INTERVAL ''1 minute''', TG_TABLE_NAME)
    INTO recent_count;
  IF recent_count >= max_per_minute THEN
    RAISE EXCEPTION 'Too many submissions right now -- please wait a minute and try again.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inquiries_rate_limit ON inquiries;
CREATE TRIGGER inquiries_rate_limit BEFORE INSERT ON inquiries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_insert_rate_limit(20);

DROP TRIGGER IF EXISTS registrations_rate_limit ON registrations;
CREATE TRIGGER registrations_rate_limit BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_insert_rate_limit(20);

DROP TRIGGER IF EXISTS notifications_rate_limit ON notifications;
CREATE TRIGGER notifications_rate_limit BEFORE INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_insert_rate_limit(40);
