-- ============================================================
-- Aviyana Ceylon Resort — Profiles Diagnose & Full Reset
-- Run each section separately in Supabase SQL Editor, in order.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: DIAGNOSE — see what actually exists right now.
-- Run this first and look at the results before doing anything else.
-- ------------------------------------------------------------

-- Every real auth account that has ever signed up:
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Every profile row (should be one per auth.users row, auto-created by the trigger):
SELECT id, email, name, account_type, staff_role FROM profiles ORDER BY created_at DESC;

-- If the first query shows users but the second query shows FEWER rows (or none),
-- the auto-create-profile trigger didn't fire — that's almost certainly why
-- "UPDATE profiles SET account_type = 'admin' WHERE email = '...'" did nothing:
-- there was no row to update.


-- ------------------------------------------------------------
-- STEP 2A: FULL RESET — wipe every account and start completely fresh.
-- This deletes from auth.users, which cascades and deletes the matching
-- profiles rows automatically (profiles.id -> auth.users.id ON DELETE CASCADE).
-- Use this if you just want to sign up again from a clean slate.
-- ------------------------------------------------------------
DELETE FROM auth.users;

-- (Optional, only if the above somehow leaves orphaned rows behind)
DELETE FROM profiles;


-- ------------------------------------------------------------
-- STEP 2B: PROFILES-ONLY RESET — keep the auth accounts (so people don't
-- have to re-enter passwords) but wipe just the profiles table, then
-- manually recreate a row per existing auth user. Use this instead of 2A
-- if you don't want to lose already-created logins.
-- ------------------------------------------------------------
DELETE FROM profiles;

INSERT INTO profiles (id, email, name, account_type)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 'guest'
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- STEP 3: Re-check the trigger itself is actually installed correctly.
-- If this returns zero rows, the trigger is missing/broken — re-run the
-- "0. Profiles Table" section of supabase-setup.sql (the CREATE FUNCTION
-- and CREATE TRIGGER statements) before signing up again.
-- ------------------------------------------------------------
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';


-- ------------------------------------------------------------
-- STEP 4: Sign up again through the app (Create Guest Account), THEN run
-- this to confirm a profile row now exists:
-- ------------------------------------------------------------
SELECT id, email, name, account_type FROM profiles ORDER BY created_at DESC LIMIT 1;


-- ------------------------------------------------------------
-- STEP 5: Promote that account to admin. Double check the email matches
-- EXACTLY what STEP 4 showed (copy-paste it, don't retype it).
-- ------------------------------------------------------------
UPDATE profiles
SET account_type = 'admin'
WHERE email = 'your@email.com';  -- <-- replace with your real signup email

-- Confirm it worked:
SELECT email, account_type FROM profiles WHERE account_type = 'admin';
