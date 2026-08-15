import { getSupabase, isSupabaseConfigured } from './supabase';
import { SocialLink } from '../types';

// Maps between the app's camelCase SocialLink shape and the snake_case
// `social_links` table columns. `platform` is the primary key (one row per
// platform), which is also used as the id for edit/delete operations since
// SocialLink itself has no separate id field.

interface SocialLinkRow {
  platform: string;
  handle: string;
  url: string;
  icon_name: string;
  description: string | null;
}

function toRow(link: SocialLink): SocialLinkRow {
  return {
    platform: link.platform,
    handle: link.handle,
    url: link.url,
    icon_name: link.iconName,
    description: link.description || null
  };
}

function fromRow(row: SocialLinkRow): SocialLink {
  return {
    platform: row.platform,
    handle: row.handle,
    url: row.url,
    iconName: row.icon_name as SocialLink['iconName'],
    description: row.description || ''
  };
}

/** Loads all social links from Supabase. Returns null if Supabase isn't configured or the request fails. */
export async function fetchSocialLinksFromDb(): Promise<SocialLink[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('social_links').select('*');
  if (error) {
    console.error('Supabase fetchSocialLinksFromDb error:', error.message);
    return null;
  }
  return (data as SocialLinkRow[]).map(fromRow);
}

/** Creates or updates a social link (upsert by platform). Returns null on success, or an error message on failure/not-configured. */
export async function upsertSocialLinkInDb(link: SocialLink): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('social_links').upsert(toRow(link));
  if (error) {
    console.error('Supabase upsertSocialLinkInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Deletes a social link by platform name. Returns null on success, or an error message on failure/not-configured. */
export async function deleteSocialLinkFromDb(platform: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('social_links').delete().eq('platform', platform);
  if (error) {
    console.error('Supabase deleteSocialLinkFromDb error:', error.message);
    return error.message;
  }
  return null;
}
