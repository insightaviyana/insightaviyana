import { getSupabase, isSupabaseConfigured } from './supabase';
import { Executive } from '../types';

// Maps between the app's camelCase Executive shape and the snake_case
// `executives` table columns. Same shape/pattern as socialLinksApi.ts.

interface ExecutiveRow {
  id: string;
  name: string;
  title: string;
  avatar_url: string;
  display_order: number;
}

function toRow(exec: Executive): ExecutiveRow {
  return {
    id: exec.id,
    name: exec.name,
    title: exec.title,
    avatar_url: exec.avatarUrl,
    display_order: exec.displayOrder
  };
}

function fromRow(row: ExecutiveRow): Executive {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    avatarUrl: row.avatar_url,
    displayOrder: row.display_order
  };
}

/** Loads all executives from Supabase, ordered for display. Returns null if Supabase isn't configured or the request fails. */
export async function fetchExecutivesFromDb(): Promise<Executive[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('executives').select('*').order('display_order', { ascending: true });
  if (error) {
    console.error('Supabase fetchExecutivesFromDb error:', error.message);
    return null;
  }
  return (data as ExecutiveRow[]).map(fromRow);
}

/** Creates or updates an executive (upsert by id). Returns null on success, or an error message on failure/not-configured. */
export async function upsertExecutiveInDb(exec: Executive): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('executives').upsert(toRow(exec));
  if (error) {
    console.error('Supabase upsertExecutiveInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Deletes an executive by id. Returns null on success, or an error message on failure/not-configured. */
export async function deleteExecutiveFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('executives').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteExecutiveFromDb error:', error.message);
    return error.message;
  }
  return null;
}
