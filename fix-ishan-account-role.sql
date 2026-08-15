-- ============================================================
-- Run this AFTER re-running the full supabase-setup.sql (both are
-- idempotent, so re-running supabase-setup.sql is always safe).
-- ============================================================

-- Sets Ishan's real staff_role so the Navbar/Dashboard stop defaulting
-- to "PUBLIC VISITOR" (that label only shows when staff_role is NULL).
-- account_type is included too in case it was ever reset.
UPDATE profiles
SET account_type = 'admin',
    staff_role = 'IT_LEAD',
    title = 'SE (Technical Lead & Web Architect)'
WHERE email = 'ishan@aviyana.lk';

-- Verify:
SELECT id, email, account_type, staff_role, title FROM profiles WHERE email = 'ishan@aviyana.lk';
-- Expect one row: account_type = admin, staff_role = IT_LEAD.
-- If this returns 0 rows, the profile row itself doesn't exist yet --
-- run profiles-reset-and-diagnose.sql first, then repeat this file.
