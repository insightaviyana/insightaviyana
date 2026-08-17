import { getSupabase, isSupabaseConfigured, resolveAmbiguousDeleteResult } from './supabase';
import { SponsoredEvent, SponsoredEventMedia, SponsoredEventPhoto } from '../types';

// --- Sponsored Events (event metadata cards) -----------------------------

interface SponsoredEventRow {
  id: string;
  title: string;
  sponsor_name: string;
  description: string;
  event_date: string;
  cover_image_url: string;
  location: string | null;
}

function eventToRow(e: SponsoredEvent): SponsoredEventRow {
  return {
    id: e.id,
    title: e.title,
    sponsor_name: e.sponsorName,
    description: e.description,
    event_date: e.eventDate,
    cover_image_url: e.coverImageUrl,
    location: e.location || null
  };
}

function rowToEvent(r: SponsoredEventRow): SponsoredEvent {
  return {
    id: r.id,
    title: r.title,
    sponsorName: r.sponsor_name,
    description: r.description,
    eventDate: r.event_date,
    coverImageUrl: r.cover_image_url,
    location: r.location || undefined
  };
}

export async function fetchSponsoredEventsFromDb(): Promise<SponsoredEvent[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('sponsored_events').select('*').order('event_date', { ascending: false });
  if (error) { console.error('fetchSponsoredEventsFromDb:', error.message); return null; }
  return (data as SponsoredEventRow[]).map(rowToEvent);
}

export async function createSponsoredEventInDb(item: SponsoredEvent): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('sponsored_events').insert(eventToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}

export async function deleteSponsoredEventFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  // Delete dependent media/photos first (no ON DELETE CASCADE assumed) so an
  // event removal doesn't leave orphaned gallery rows behind.
  await supabase.from('sponsored_event_media').delete().eq('event_id', id);
  await supabase.from('sponsored_event_photos').delete().eq('event_id', id);
  const { data, error } = await supabase.from('sponsored_events').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'sponsored_events', 'id', id, 'sponsored event');
  return null;
}

// --- Sponsored Event video gallery ----------------------------------------

interface SponsoredEventMediaRow {
  id: string;
  event_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  date: string;
}

function mediaToRow(m: SponsoredEventMedia): SponsoredEventMediaRow {
  return { id: m.id, event_id: m.eventId, title: m.title, video_url: m.videoUrl, thumbnail_url: m.thumbnailUrl, date: m.date };
}
function rowToMedia(r: SponsoredEventMediaRow): SponsoredEventMedia {
  return { id: r.id, eventId: r.event_id, title: r.title, videoUrl: r.video_url, thumbnailUrl: r.thumbnail_url, date: r.date };
}

export async function fetchSponsoredEventMediaFromDb(): Promise<SponsoredEventMedia[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('sponsored_event_media').select('*').order('date', { ascending: false });
  if (error) { console.error('fetchSponsoredEventMediaFromDb:', error.message); return null; }
  return (data as SponsoredEventMediaRow[]).map(rowToMedia);
}

export async function createSponsoredEventMediaInDb(item: SponsoredEventMedia): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('sponsored_event_media').insert(mediaToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}

export async function deleteSponsoredEventMediaFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('sponsored_event_media').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'sponsored_event_media', 'id', id, 'video');
  return null;
}

// --- Sponsored Event photo gallery (albums) -------------------------------

interface SponsoredEventPhotoRow {
  id: string;
  event_id: string;
  image_url: string;
  caption: string;
  date: string;
  album_id: string | null;
  album_name: string | null;
  is_cover: boolean | null;
}

function photoToRow(p: SponsoredEventPhoto): SponsoredEventPhotoRow {
  return { id: p.id, event_id: p.eventId, image_url: p.imageUrl, caption: p.caption, date: p.date, album_id: p.albumId || null, album_name: p.albumName || null, is_cover: p.isCover ?? null };
}
function rowToPhoto(r: SponsoredEventPhotoRow): SponsoredEventPhoto {
  return { id: r.id, eventId: r.event_id, imageUrl: r.image_url, caption: r.caption, date: r.date, albumId: r.album_id || undefined, albumName: r.album_name || undefined, isCover: r.is_cover ?? undefined };
}

export async function fetchSponsoredEventPhotosFromDb(): Promise<SponsoredEventPhoto[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('sponsored_event_photos').select('*').order('date', { ascending: false });
  if (error) { console.error('fetchSponsoredEventPhotosFromDb:', error.message); return null; }
  return (data as SponsoredEventPhotoRow[]).map(rowToPhoto);
}

export async function createSponsoredEventPhotoInDb(item: SponsoredEventPhoto): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('sponsored_event_photos').insert(photoToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}

export async function updateSponsoredEventPhotoInDb(id: string, updates: Partial<Pick<SponsoredEventPhoto, 'albumId' | 'albumName' | 'isCover' | 'caption'>>): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const row: Record<string, unknown> = {};
  if (updates.albumId !== undefined) row.album_id = updates.albumId || null;
  if (updates.albumName !== undefined) row.album_name = updates.albumName || null;
  if (updates.isCover !== undefined) row.is_cover = updates.isCover;
  if (updates.caption !== undefined) row.caption = updates.caption;
  const { data, error } = await supabase.from('sponsored_event_photos').update(row).eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Update did not save — no matching row found or no permission. It will look changed now but WILL revert on refresh.';
  return null;
}

export async function deleteSponsoredEventPhotoFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('sponsored_event_photos').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'sponsored_event_photos', 'id', id, 'photo');
  return null;
}
