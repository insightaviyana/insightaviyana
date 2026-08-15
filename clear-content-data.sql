-- ============================================================
-- Aviyana Insight — Clear All Content Data (KEEPS staff/user accounts)
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- What this does:
--   Deletes every row from every CONTENT table (articles, milestones,
--   fact-checks, content pipeline drafts, courses, education media/photos,
--   inquiries, registrations, notifications, social links, activity log).
--
-- What this does NOT touch:
--   `profiles` — every staff/admin/guest account, name, role, email, avatar,
--   etc. Nobody has to sign up again or gets demoted/logged out after
--   running this. Supabase Auth users (auth.users) are also left alone.
--
-- Safe to re-run — TRUNCATE on an already-empty table is a no-op.
-- This is IRREVERSIBLE for the data it does delete. Consider exporting a
-- backup first (Supabase Dashboard → Database → Backups, or `pg_dump`) if
-- any of this content might be needed later.
-- ============================================================

TRUNCATE TABLE
  announcements,       -- Articles / press releases
  milestones,          -- News / construction / CEA clearance items
  csr_impacts,         -- Guest Voices / CSR / fleet impact cards
  voice_cuts,          -- Press statements / executive voice cuts
  fact_checks,         -- Fact-check / myth-vs-reality entries
  content_pipeline,    -- Content Pipeline drafts (all statuses)
  courses,             -- Aviyana Global Campus courses
  education_media,     -- Student Voice / Event videos
  education_photos,    -- Campus/student/event photo gallery
  inquiries,           -- Public inquiry desk submissions
  registrations,       -- VIP/Press pass registrations
  notifications,       -- Staff notification feed
  social_links,        -- Social media links bar
  activity_log         -- Staff activity/audit log
RESTART IDENTITY CASCADE;

-- `profiles` is intentionally excluded above -- this is what keeps every
-- staff/admin/guest account intact. Do not add it to the TRUNCATE list
-- unless you specifically want to wipe user accounts too (and even then,
-- note that `profiles.id` is a foreign key to `auth.users`, so clearing
-- `profiles` alone would leave orphaned Supabase Auth logins behind --
-- that would need to be done from the Auth panel, not this table).

-- Optional: also empty the Storage buckets (uploaded images/CVs left behind
-- by the deleted rows above still exist as files in Storage even after this
-- runs, since Storage isn't a regular table TRUNCATE reaches). Uncomment if
-- you want those gone too -- this does NOT touch the `avatars` bucket, so
-- profile pictures are unaffected either way.
--
-- delete from storage.objects where bucket_id = 'content-images';
-- delete from storage.objects where bucket_id = 'resumes';
