import { getSupabase, isSupabaseConfigured, resolveAmbiguousDeleteResult } from './supabase';
import { EducationMedia, EducationPhoto } from '../types';

interface EducationMediaRow {
  id: string;
  type: string;
  title: string;
  person_name: string;
  person_detail: string;
  thumbnail_url: string;
  video_url: string;
  date: string;
}

function toRow(m: EducationMedia): EducationMediaRow {
  return {
    id: m.id,
    type: m.type,
    title: m.title,
    person_name: m.personName,
    person_detail: m.personDetail,
    thumbnail_url: m.thumbnailUrl,
    video_url: m.videoUrl,
    date: m.date
  };
}

function fromRow(r: EducationMediaRow): EducationMedia {
  return {
    id: r.id,
    type: r.type as EducationMedia['type'],
    title: r.title,
    personName: r.person_name,
    personDetail: r.person_detail,
    thumbnailUrl: r.thumbnail_url,
    videoUrl: r.video_url,
    date: r.date
  };
}

export async function fetchEducationMediaFromDb(): Promise<EducationMedia[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('education_media').select('*').order('date', { ascending: false });
  if (error) { console.error('fetchEducationMediaFromDb:', error.message); return null; }
  return (data as EducationMediaRow[]).map(fromRow);
}

export async function createEducationMediaInDb(item: EducationMedia): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('education_media').insert(toRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}

export async function deleteEducationMediaFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('education_media').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'education_media', 'id', id, 'video');
  return null;
}

// --- Education photo gallery (separate small table -- just image + caption) ---

interface EducationPhotoRow {
  id: string;
  image_url: string;
  caption: string;
  date: string;
}

function photoToRow(p: EducationPhoto): EducationPhotoRow {
  return { id: p.id, image_url: p.imageUrl, caption: p.caption, date: p.date };
}
function rowToPhoto(r: EducationPhotoRow): EducationPhoto {
  return { id: r.id, imageUrl: r.image_url, caption: r.caption, date: r.date };
}

export async function fetchEducationPhotosFromDb(): Promise<EducationPhoto[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('education_photos').select('*').order('date', { ascending: false });
  if (error) { console.error('fetchEducationPhotosFromDb:', error.message); return null; }
  return (data as EducationPhotoRow[]).map(rowToPhoto);
}

export async function createEducationPhotoInDb(item: EducationPhoto): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('education_photos').insert(photoToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}

export async function deleteEducationPhotoFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('education_photos').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'education_photos', 'id', id, 'photo');
  return null;
}
