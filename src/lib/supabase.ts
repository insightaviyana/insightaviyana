import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

/**
 * Disambiguates a delete call that reported "0 rows affected".
 *
 * `.delete().eq('id', id).select('id')` returning an empty array is
 * genuinely ambiguous -- Postgres/PostgREST don't tell you WHY zero rows
 * matched. Two very different situations look identical from that response
 * alone:
 *
 *   1. The row was already gone (deleted a moment earlier from another tab,
 *      double-clicked, or was only ever optimistic local state that never
 *      made it into the database in the first place) -- in which case the
 *      desired end state (row gone) is already achieved and there is
 *      nothing wrong at all.
 *   2. The row still exists, but Row Level Security silently blocked the
 *      delete for the signed-in user (expired session, wrong account_type,
 *      etc.) -- a real problem worth alarming the user about, since the
 *      local UI now disagrees with the database.
 *
 * Every `delete*FromDb` function in this app used to treat both cases as
 * case (2) and show a scary "WILL reappear on refresh" warning even when
 * the item was already correctly gone -- exactly the kind of false alarm
 * that erodes trust in the real warnings. This does one cheap follow-up
 * SELECT to tell the two apart before deciding what (if anything) to tell
 * the user.
 */
export async function resolveAmbiguousDeleteResult(
  supabase: SupabaseClient,
  table: string,
  idColumn: string,
  idValue: string,
  itemLabel: string
): Promise<string | null> {
  const { data: stillThere, error: checkError } = await supabase
    .from(table)
    .select(idColumn)
    .eq(idColumn, idValue)
    .maybeSingle();

  if (checkError) {
    // Couldn't confirm either way -- fall back to the cautious message
    // rather than silently swallowing a possible real failure.
    console.error(`resolveAmbiguousDeleteResult (${table}) follow-up check failed:`, checkError.message);
    return `Delete did not save — no matching row found or no permission. It will look removed now but WILL reappear on refresh. (${itemLabel})`;
  }
  if (!stillThere) {
    // Row genuinely doesn't exist -- already deleted, or never persisted to
    // begin with. That's the outcome the user wanted; not a failure.
    return null;
  }
  // The row is still there, but the delete affected 0 rows -- RLS actually
  // blocked this one.
  return `Delete blocked — you don't have permission to delete this item, or your session may have expired. It will look removed now but WILL reappear on refresh. (${itemLabel})`;
}

/**
 * SQL Schema script to run in Supabase SQL Editor.
 * This matches the ArticleItem shape used by AnnouncementsView / PublicHubView exactly --
 * run this (and the SupabaseModal's copy of it) once per project so published
 * articles persist across page reloads and are visible to every visitor,
 * not just the browser tab that created them.
 *
 * -- 1. Announcements Table
 * CREATE TABLE IF NOT EXISTS announcements (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   subtitle TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   author TEXT NOT NULL,
 *   author_role TEXT NOT NULL,
 *   date TEXT NOT NULL,
 *   content TEXT NOT NULL,
 *   cover_image_url TEXT,
 *   media_type TEXT,
 *   video_url TEXT,
 *   video_caption TEXT,
 *   status TEXT NOT NULL DEFAULT 'Published',
 *   views_count INT DEFAULT 0,
 *   featured BOOLEAN DEFAULT false,
 *   tags JSONB DEFAULT '[]'::jsonb,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 *
 * -- Allow public read access (anyone visiting the site can see published articles)
 * ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public can read announcements" ON announcements FOR SELECT USING (true);
 * CREATE POLICY "Anyone with anon key can write announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
 *
 * -- 2. Content Pipeline Table
 * CREATE TABLE IF NOT EXISTS content_pipeline (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   author TEXT NOT NULL,
 *   date TEXT NOT NULL,
 *   status TEXT NOT NULL,
 *   platform JSONB NOT NULL,
 *   media_preview_url TEXT NOT NULL,
 *   notes TEXT NOT NULL,
 *   publish_time_minutes INT DEFAULT 5,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 *
 * -- 3. Fact Checks Table
 * CREATE TABLE IF NOT EXISTS fact_checks (
 *   id TEXT PRIMARY KEY,
 *   rumor TEXT NOT NULL,
 *   fact TEXT NOT NULL,
 *   official_source TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   status TEXT NOT NULL,
 *   verified_date TEXT NOT NULL,
 *   document_proof TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
 * );
 */
