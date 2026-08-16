-- ============================================================
-- RLS Policy Tests -- Priority 2, NEXT_SESSION_PLAN.md
--
-- Tests the actual server-side enforcement layer for the approval-gated
-- tables (announcements, fact_checks, content_pipeline): a staff account
-- must NEVER be able to insert or update a row into the "published" state
-- directly, no matter what the client-side UI thinks it's doing. This is
-- the single most valuable test in this project, because it's the layer
-- that's actually enforced -- everything in the React app is defense in
-- depth on top of this.
--
-- HOW TO RUN THIS:
--   Requires the Supabase CLI (https://supabase.com/docs/guides/cli) --
--   this spins up a local, disposable Postgres+Supabase instance, loads
--   supabase-setup.sql into it, then runs this file with pgTAP.
--
--     supabase start          (first time only, or after `supabase stop`)
--     supabase test db
--
--   This does NOT touch your real/production Supabase project -- it runs
--   entirely against a local, throwaway database. Safe to run as often as
--   you like, including in CI.
--
-- WHY THIS FILE, NOT JUST THE FRONTEND TESTS:
--   src/lib/statusTransitions.test.ts (Vitest) checks that the APP knows
--   the right rule. This file checks that the DATABASE enforces it even if
--   the app is wrong, buggy, bypassed, or someone calls the Supabase API
--   directly with a valid staff session token. Only this file can actually
--   catch a real security gap -- see the plan's Priority 2 section for
--   the specific historical bug (content_pipeline's UPDATE policy missing
--   this exact restriction) that a test like this would have caught
--   immediately instead of needing a manual re-read of every table.
-- ============================================================

BEGIN;
SELECT plan(18);

-- ------------------------------------------------------------
-- Test fixtures: one admin, one staff, one guest -- each with a real
-- auth.users row (so auth.uid() resolves) and a matching profiles row
-- (so is_admin()/is_staff_or_admin() resolve correctly).
-- ------------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test-admin@aviyana.test'),
  ('00000000-0000-0000-0000-000000000002', 'test-staff@aviyana.test'),
  ('00000000-0000-0000-0000-000000000003', 'test-guest@aviyana.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, name, account_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test-admin@aviyana.test', 'Test Admin', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'test-staff@aviyana.test', 'Test Staff', 'staff'),
  ('00000000-0000-0000-0000-000000000003', 'test-guest@aviyana.test', 'Test Guest', 'guest')
ON CONFLICT (id) DO UPDATE SET account_type = EXCLUDED.account_type;

-- Helper: switch the current session to act as one of the fixture users,
-- the way Supabase's PostgREST layer does for a real authenticated request.
CREATE OR REPLACE FUNCTION test_act_as(p_user_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- announcements
-- ============================================================

SELECT test_act_as('00000000-0000-0000-0000-000000000002'); -- staff
SELECT throws_ok(
  $$ INSERT INTO announcements (id, title, subtitle, category, author, author_role, date, content, status)
     VALUES ('t-art-1', 'Test', 'Test', 'Press Release', 'Staff', 'Staff', '2026-01-01', 'x', 'Published') $$,
  NULL,
  NULL,
  'staff cannot INSERT an announcement directly as Published'
);

SELECT lives_ok(
  $$ INSERT INTO announcements (id, title, subtitle, category, author, author_role, date, content, status)
     VALUES ('t-art-2', 'Test', 'Test', 'Press Release', 'Staff', 'Staff', '2026-01-01', 'x', 'In Review') $$,
  'staff CAN insert an announcement in a non-Published state (their job is not blocked)'
);

SELECT throws_ok(
  $$ UPDATE announcements SET status = 'Published' WHERE id = 't-art-2' $$,
  NULL,
  NULL,
  'staff cannot UPDATE an existing announcement to Published'
);

SELECT test_act_as('00000000-0000-0000-0000-000000000001'); -- admin
SELECT lives_ok(
  $$ INSERT INTO announcements (id, title, subtitle, category, author, author_role, date, content, status)
     VALUES ('t-art-3', 'Test', 'Test', 'Press Release', 'Admin', 'Admin', '2026-01-01', 'x', 'Published') $$,
  'admin CAN insert an announcement directly as Published'
);
SELECT lives_ok(
  $$ UPDATE announcements SET status = 'Published' WHERE id = 't-art-2' $$,
  'admin CAN update an existing announcement to Published'
);

-- ============================================================
-- fact_checks
-- ============================================================

SELECT test_act_as('00000000-0000-0000-0000-000000000002'); -- staff
SELECT throws_ok(
  $$ INSERT INTO fact_checks (id, rumor, fact, official_source, category, status, verified_date, approval_status)
     VALUES ('t-fc-1', 'r', 'f', 's', 'Construction', 'Verified Fact', '2026-01-01', 'Published') $$,
  NULL,
  NULL,
  'staff cannot INSERT a fact-check directly as Published (approval_status)'
);

SELECT lives_ok(
  $$ INSERT INTO fact_checks (id, rumor, fact, official_source, category, status, verified_date, approval_status)
     VALUES ('t-fc-2', 'r', 'f', 's', 'Construction', 'Verified Fact', '2026-01-01', 'Pending Approval') $$,
  'staff CAN insert a fact-check pending approval'
);

SELECT throws_ok(
  $$ UPDATE fact_checks SET approval_status = 'Published' WHERE id = 't-fc-2' $$,
  NULL,
  NULL,
  'staff cannot UPDATE a fact-check to Published approval_status'
);

SELECT test_act_as('00000000-0000-0000-0000-000000000001'); -- admin
SELECT lives_ok(
  $$ UPDATE fact_checks SET approval_status = 'Published' WHERE id = 't-fc-2' $$,
  'admin CAN approve (publish) a pending fact-check'
);

-- ============================================================
-- content_pipeline
-- (this is the table whose UPDATE policy was historically missing this
-- exact restriction -- see the plan's Priority 2 notes, item 5)
-- ============================================================

SELECT test_act_as('00000000-0000-0000-0000-000000000002'); -- staff
SELECT throws_ok(
  $$ INSERT INTO content_pipeline (id, title, author, date, status, platform, media_preview_url, notes)
     VALUES ('t-cp-1', 'Test', 'Staff', '2026-01-01', 'Published', '["Instagram"]'::jsonb, 'x', 'x') $$,
  NULL,
  NULL,
  'staff cannot INSERT a content_pipeline draft directly as Published'
);

SELECT lives_ok(
  $$ INSERT INTO content_pipeline (id, title, author, date, status, platform, media_preview_url, notes)
     VALUES ('t-cp-2', 'Test', 'Staff', '2026-01-01', 'Pending SE Approval', '["Instagram"]'::jsonb, 'x', 'x') $$,
  'staff CAN insert a content_pipeline draft pending approval'
);

SELECT throws_ok(
  $$ UPDATE content_pipeline SET status = 'Published' WHERE id = 't-cp-2' $$,
  NULL,
  NULL,
  'staff cannot UPDATE a content_pipeline draft to Published -- regression test for the historical gap where this table''s UPDATE policy allowed exactly this'
);

SELECT lives_ok(
  $$ UPDATE content_pipeline SET title = 'Edited title' WHERE id = 't-cp-2' $$,
  'staff CAN still edit a non-Published draft (the fix must not lock staff out of their job)'
);

SELECT test_act_as('00000000-0000-0000-0000-000000000001'); -- admin
SELECT lives_ok(
  $$ UPDATE content_pipeline SET status = 'Published' WHERE id = 't-cp-2' $$,
  'admin CAN approve (publish) a pending content_pipeline draft'
);

-- ============================================================
-- guest (neither staff nor admin) -- must be rejected on all three tables,
-- regardless of target status, since they should never be able to write
-- to any of them at all.
-- ============================================================

SELECT test_act_as('00000000-0000-0000-0000-000000000003'); -- guest
SELECT throws_ok(
  $$ INSERT INTO announcements (id, title, subtitle, category, author, author_role, date, content, status)
     VALUES ('t-art-guest', 'Test', 'Test', 'Press Release', 'Guest', 'Guest', '2026-01-01', 'x', 'In Review') $$,
  NULL,
  NULL,
  'a guest cannot insert an announcement at all, even in a non-Published state'
);
SELECT throws_ok(
  $$ INSERT INTO fact_checks (id, rumor, fact, official_source, category, status, verified_date, approval_status)
     VALUES ('t-fc-guest', 'r', 'f', 's', 'Construction', 'Verified Fact', '2026-01-01', 'Pending Approval') $$,
  NULL,
  NULL,
  'a guest cannot insert a fact-check at all'
);
SELECT throws_ok(
  $$ INSERT INTO content_pipeline (id, title, author, date, status, platform, media_preview_url, notes)
     VALUES ('t-cp-guest', 'Test', 'Guest', '2026-01-01', 'Pending SE Approval', '["Instagram"]'::jsonb, 'x', 'x') $$,
  NULL,
  NULL,
  'a guest cannot insert a content_pipeline draft at all'
);
-- Unlike INSERT (which raises a real "violates row-level security policy"
-- exception when WITH CHECK fails), an UPDATE whose USING clause excludes
-- every row doesn't throw anything -- it just matches zero rows and
-- "succeeds" having changed nothing. throws_ok is the wrong assertion for
-- that shape; results_eq against an empty RETURNING set is what actually
-- proves the guest's update had no effect.
SELECT results_eq(
  $$ UPDATE announcements SET title = 'hacked' WHERE id = 't-art-3' RETURNING id $$,
  ARRAY[]::text[],
  'a guest cannot update an existing announcement at all -- the UPDATE silently matches zero rows, proving RLS excluded it'
);

SELECT * FROM finish();
ROLLBACK;
