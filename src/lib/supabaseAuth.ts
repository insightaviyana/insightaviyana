import { getSupabase, isSupabaseConfigured } from './supabase';
import { User, UserRole, AccountType } from '../types';
import { compressImage } from './imageCompression';

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  account_type: AccountType;
  staff_role: UserRole | null;
  title: string | null;
  responsibilities: string[] | null;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=80';

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    accountType: row.account_type,
    role: row.staff_role || 'PUBLIC_VISITOR',
    title: row.title || (row.account_type === 'admin' ? 'Administrator' : row.account_type === 'staff' ? 'Staff Member' : 'Guest Reader'),
    avatar: row.avatar_url || DEFAULT_AVATAR,
    responsibilities: row.responsibilities || []
  };
}

/** Fetches the profile row for a given auth user id. Returns null if not found or Supabase isn't configured. */
export async function fetchProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) {
    console.error('fetchProfile error:', error?.message);
    return null;
  }
  return rowToUser(data as ProfileRow);
}

/** Guest self-registration: email + password + name. Creates the auth user; the profiles row is created automatically by a DB trigger. */
export async function signUpGuest(email: string, password: string, name: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase not configured' };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, account_type: 'guest' } }
  });
  return { error: error ? error.message : null };
}

/** Email + password sign-in for any account type (guest, staff, or admin). */
export async function signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase not configured' };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? error.message : null };
}

/** Starts the Google OAuth sign-in flow (redirects away and back). Guest accounts only. */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase not configured' };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  return { error: error ? error.message : null };
}

export async function signOutUser(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Uploads a new avatar image to Supabase Storage and updates the profile's avatar_url. Returns the new public URL, or null on failure. */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  // Avatars are shown small (a few dozen px) almost everywhere, so a much
  // smaller max dimension than content images is fine here -- 512px keeps
  // it sharp even at 2x pixel density while avoiding uploading a full
  // multi-megabyte phone photo just to show a tiny profile picture.
  const optimized = await compressImage(file, 512, 0.85);
  const ext = optimized.name.split('.').pop();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, optimized, { upsert: true });
  if (uploadError) {
    console.error('uploadAvatar error:', uploadError.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
  if (updateError) {
    console.error('uploadAvatar profile update error:', updateError.message);
    return null;
  }

  return publicUrl;
}

/** Updates editable profile fields (name/title) for the current user. */
export async function updateProfileFields(userId: string, fields: { name?: string; title?: string }): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  return error ? error.message : null;
}

/** Admin only (enforced by RLS): fetches every profile for the User Management panel. */
export async function fetchAllProfiles(): Promise<User[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('profiles').select('*').order('email');
  if (error) {
    console.error('fetchAllProfiles error:', error.message);
    return null;
  }
  return (data as ProfileRow[]).map(rowToUser);
}

/** Admin only: updates another user's account_type / staff_role / name directly (an RLS policy allows admins to update any profile). */
export async function adminUpdateProfile(
  userId: string,
  fields: { name?: string; accountType?: AccountType; staffRole?: UserRole | null; title?: string }
): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const payload: Record<string, any> = {};
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.accountType !== undefined) payload.account_type = fields.accountType;
  if (fields.staffRole !== undefined) payload.staff_role = fields.staffRole;
  if (fields.title !== undefined) payload.title = fields.title;

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  return error ? error.message : null;
}

/** Gets the current Supabase session's access token, needed to authorize calls to the admin Netlify Functions. */
export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
