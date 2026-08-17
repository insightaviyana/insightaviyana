import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * General-purpose editable key/value settings -- see the comment above the
 * `site_settings` table in supabase-setup.sql for the reasoning. Every key
 * has a hardcoded default here, so a fresh install (or any key nobody has
 * explicitly set yet) still renders correct-looking content instead of a
 * blank field -- `getSetting()` below is the only thing callers should use,
 * never read straight from the fetched map.
 */
export const SITE_SETTING_DEFAULTS: Record<string, string> = {
  contact_email: 'insight@aviyana.lk',
  contact_email_note: 'Direct channel to PR Lead Heshan & Technical SE Ishan Ekanayake',
  hq_name: 'Aviyana Ceylon Resort Estate',
  hq_address: 'Mountain Corridor Estate, Kandy, Sri Lanka',
  portal_note: '100% CEA cleared document proof & official announcements',
};

export type SiteSettingsMap = Record<string, string>;

/** Looks up a setting, falling back to its hardcoded default if unset/unfetched. */
export function getSetting(settings: SiteSettingsMap, key: string): string {
  return settings[key] ?? SITE_SETTING_DEFAULTS[key] ?? '';
}

interface SiteSettingRow {
  key: string;
  value: string;
}

/** Loads every site setting as a flat key->value map. Returns null if Supabase isn't configured or the request fails (callers should keep using SITE_SETTING_DEFAULTS in that case). */
export async function fetchSiteSettingsFromDb(): Promise<SiteSettingsMap | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) {
    console.error('Supabase fetchSiteSettingsFromDb error:', error.message);
    return null;
  }
  const map: SiteSettingsMap = {};
  (data as SiteSettingRow[]).forEach(row => { map[row.key] = row.value; });
  return map;
}

/** Creates or updates a single setting (upsert by key). Returns null on success, or an error message on failure/not-configured. */
export async function saveSiteSettingInDb(key: string, value: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('site_settings').upsert({ key, value });
  if (error) {
    console.error('Supabase saveSiteSettingInDb error:', error.message);
    return error.message;
  }
  return null;
}
