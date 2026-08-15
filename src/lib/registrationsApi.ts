import { getSupabase, isSupabaseConfigured } from './supabase';
import { UserRegistration } from '../types';

// Maps between the app's camelCase UserRegistration shape and the
// snake_case `registrations` table columns. Same public-insert /
// staff-only-read pattern as inquiries -- see inquiriesApi.ts.

interface RegistrationRow {
  id: string;
  name: string;
  email: string;
  organization_role: string;
  contact: string | null;
  interests: string[] | null;
  vip_pass_code: string;
  registered_at: string;
}

function toRow(reg: UserRegistration): RegistrationRow {
  return {
    id: reg.id,
    name: reg.name,
    email: reg.email,
    organization_role: reg.organizationRole,
    contact: reg.contact || null,
    interests: reg.interests,
    vip_pass_code: reg.vipPassCode,
    registered_at: reg.registeredAt
  };
}

function fromRow(row: RegistrationRow): UserRegistration {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    organizationRole: row.organization_role as UserRegistration['organizationRole'],
    contact: row.contact || '',
    interests: row.interests || [],
    vipPassCode: row.vip_pass_code,
    registeredAt: row.registered_at
  };
}

/**
 * Loads all VIP/press registrations from Supabase, newest first. Only
 * succeeds for a signed-in staff/admin account (see RLS notes in
 * inquiriesApi.ts).
 */
export async function fetchRegistrationsFromDb(): Promise<UserRegistration[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchRegistrationsFromDb error:', error.message);
    return null;
  }

  return (data as RegistrationRow[]).map(fromRow);
}

/** Writes a newly-submitted registration to Supabase. Returns null on success, or an error message string on failure/not-configured. */
export async function createRegistrationInDb(reg: UserRegistration): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('registrations').insert(toRow(reg));
  if (error) {
    console.error('Supabase createRegistrationInDb error:', error.message);
    return error.message;
  }
  return null;
}
