import { getSupabase, isSupabaseConfigured } from './supabase';

export interface CvUploadResult {
  /** Signed URL valid for 30 days -- the `resumes` bucket is private (staff/admin read only),
   * so a plain public URL wouldn't work; this embeds a temporary access token. */
  signedUrl: string;
  fileName: string;
}

/**
 * Uploads a CV/resume file to the private `resumes` Supabase Storage bucket
 * and returns a signed (temporary) URL for staff to view it later, since the
 * bucket itself is not public-read (resumes are personal documents).
 * Returns null on failure (caller should still let the rest of the
 * submission go through -- a failed CV upload shouldn't block the inquiry
 * itself from being recorded).
 */
export async function uploadCv(file: File, applicantName: string): Promise<CvUploadResult | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const safeName = applicantName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${safeName}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (uploadError) {
      console.error('uploadCv error:', uploadError.message);
      return null;
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
    if (signError || !signedData) {
      console.error('uploadCv signing error:', signError?.message);
      return null;
    }

    return { signedUrl: signedData.signedUrl, fileName: file.name };
  } catch (err) {
    console.error('uploadCv unexpected error:', err);
    return null;
  }
}

/** Reads a File as a base64 string (without the data: prefix) for email attachments. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
