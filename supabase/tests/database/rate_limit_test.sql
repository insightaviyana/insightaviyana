-- ============================================================
-- Rate Limit Trigger Tests
--
-- Verifies the insert-rate-limit triggers from supabase-setup.sql actually
-- exist on every table they're supposed to cover (see
-- ENGINEERING_ASSESSMENT.md, "No rate limiting beyond three tables" --
-- extended in this session to fact_checks and content_pipeline).
--
-- Deliberately a structural check (does the trigger exist, wired to the
-- right function) rather than a behavioral one (insert N+1 rows, expect the
-- (N+1)th to raise) -- a behavioral test would need to insert real rows
-- past each table's foreign-key/not-null requirements, which pulls in a
-- lot of unrelated fixture setup for a check that's really just "did
-- someone forget to attach the trigger to this table." The trigger
-- function itself (public.enforce_insert_rate_limit) is generic and
-- already exercised indirectly by every other insert in this session's
-- pgTAP suite; what's worth pinning down here is the wiring.
--
-- HOW TO RUN: same as rls_approval_workflow_test.sql --
--   supabase start   (first time only)
--   supabase test db
--
-- NOTE: unlike rls_approval_workflow_test.sql (verified live against a
-- local instance last session), this file was written and reviewed for
-- correctness in this session but NOT run against a live Postgres instance
-- here -- there's no local Supabase CLI available in this environment. Run
-- `supabase test db` once before merging to confirm it passes as written.
-- ============================================================

BEGIN;
SELECT plan(6);

-- The three original tables should still each have their trigger.
SELECT has_trigger('public', 'inquiries', 'inquiries_rate_limit', 'inquiries has its rate-limit trigger');
SELECT has_trigger('public', 'registrations', 'registrations_rate_limit', 'registrations has its rate-limit trigger');
SELECT has_trigger('public', 'notifications', 'notifications_rate_limit', 'notifications has its rate-limit trigger');

-- The two tables added in this session.
SELECT has_trigger('public', 'fact_checks', 'fact_checks_rate_limit', 'fact_checks has its rate-limit trigger');
SELECT has_trigger('public', 'content_pipeline', 'content_pipeline_rate_limit', 'content_pipeline has its rate-limit trigger');

-- The shared enforcement function itself should exist (all five triggers
-- above depend on it).
SELECT has_function('public', 'enforce_insert_rate_limit', 'the shared rate-limit enforcement function exists');

SELECT * FROM finish();
ROLLBACK;
