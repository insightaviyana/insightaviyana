import { getSupabase, isSupabaseConfigured } from './supabase';
import { PublicInquiry } from '../types';

// Maps between the app's camelCase PublicInquiry shape and the snake_case
// `inquiries` table columns. Unlike announcements/milestones/etc, this table
// is NOT publicly readable (it holds submitters' names/emails/phone
// numbers) -- only staff/admin accounts can SELECT, per RLS. Anyone
// (including a logged-out visitor) can INSERT one, which is how public
// question submissions reach the database at all.

interface InquiryRow {
  id: string;
  name: string;
  email: string;
  contact: string | null;
  category: string;
  question: string;
  submitted_at: string;
  status: string;
  ticket_number: string;
  cv_url: string | null;
  cv_file_name: string | null;
  linkedin_url: string | null;
}

function toRow(inquiry: PublicInquiry): InquiryRow {
  return {
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    contact: inquiry.contact || null,
    category: inquiry.category,
    question: inquiry.question,
    submitted_at: inquiry.submittedAt,
    status: inquiry.status,
    ticket_number: inquiry.ticketNumber,
    cv_url: inquiry.cvUrl || null,
    cv_file_name: inquiry.cvFileName || null,
    linkedin_url: inquiry.linkedinUrl || null
  };
}

function fromRow(row: InquiryRow): PublicInquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contact: row.contact || 'N/A',
    category: row.category as PublicInquiry['category'],
    question: row.question,
    submittedAt: row.submitted_at,
    status: row.status as PublicInquiry['status'],
    ticketNumber: row.ticket_number,
    cvUrl: row.cv_url || undefined,
    cvFileName: row.cv_file_name || undefined,
    linkedinUrl: row.linkedin_url || undefined
  };
}

/**
 * Loads all inquiries from Supabase, newest first. Only succeeds for a
 * signed-in staff/admin account -- RLS returns an empty set (not an error)
 * for anyone else, so a logged-out visitor just sees nothing here, which is
 * correct (they only ever see their own single ticket, held in local state
 * right after they submit it).
 */
export async function fetchInquiriesFromDb(): Promise<PublicInquiry[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchInquiriesFromDb error:', error.message);
    return null;
  }

  return (data as InquiryRow[]).map(fromRow);
}

/** Writes a newly-submitted inquiry to Supabase. Returns null on success, or an error message string on failure/not-configured. */
export async function createInquiryInDb(inquiry: PublicInquiry): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('inquiries').insert(toRow(inquiry));
  if (error) {
    console.error('Supabase createInquiryInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Updates an inquiry's status/fields in Supabase by id (staff/admin only, per RLS). */
export async function updateInquiryInDb(inquiry: PublicInquiry): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { data, error } = await supabase.from('inquiries').update(toRow(inquiry)).eq('id', inquiry.id).select('id');
  if (error) {
    console.error('Supabase updateInquiryInDb error:', error.message);
    return error.message;
  }
  if (!data || data.length === 0) {
    return 'Status update did not save — no matching row found or no permission. It will look updated now but WILL revert on refresh.';
  }
  return null;
}
