import { getSupabase, isSupabaseConfigured } from './supabase';
import { compressImage } from './imageCompression';

/**
 * Uploads an image file to the `content-images` Supabase Storage bucket and
 * returns its public URL, or null on failure/not-configured.
 *
 * This is what lets staff attach a cover image by picking a file directly
 * (like the existing avatar upload), instead of only being able to paste a
 * URL to an image that's already hosted somewhere else.
 *
 * `folder` groups uploads by feature (e.g. "milestones", "csr", "voice-cuts",
 * "articles") so the bucket doesn't become one flat pile of files.
 *
 * The file is resized/re-compressed client-side before upload -- see
 * imageCompression.ts -- so a 10MB phone photo doesn't get served as-is to
 * every visitor.
 */
export async function uploadContentImage(file: File, folder: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const optimized = await compressImage(file, 1920, 0.82);
  const ext = optimized.name.split('.').pop();
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${safeName}`;

  const { error: uploadError } = await supabase.storage.from('content-images').upload(path, optimized, { upsert: true });
  if (uploadError) {
    console.error('uploadContentImage error:', uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from('content-images').getPublicUrl(path);
  return data.publicUrl;
}
