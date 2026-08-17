import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * Newsletter subscription -- a lightweight public email capture, separate
 * from the RSS feed (RSS is for people who want to pull updates into a
 * reader; this is for people who just want updates emailed to them, the
 * more common ask for a general site visitor).
 *
 * Deliberately just captures the email address here -- there's no email-
 * sending/digest infrastructure in this project yet (see emailApi.ts,
 * which only sends transactional confirmations, not bulk newsletters).
 * Staff can export the list from Supabase and use a real mailing tool
 * (Mailchimp, Resend broadcasts, etc.) to actually send anything to it.
 */

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  subscribed_at: string;
}

function fromRow(row: SubscriberRow): NewsletterSubscriber {
  return { id: row.id, email: row.email, subscribedAt: row.subscribed_at };
}

/**
 * Subscribes an email address. Upserts on the `email` unique constraint --
 * submitting the same address twice is treated as a harmless success
 * (re-confirms the existing subscription) rather than an error a visitor
 * would find confusing ("you're already on the list" is not useful UX for
 * a public form with no login).
 */
export async function subscribeToNewsletter(email: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const row = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: email.trim().toLowerCase(),
    subscribed_at: new Date().toISOString().split('T')[0]
  };

  const { error } = await supabase.from('newsletter_subscribers').upsert(row, { onConflict: 'email' });
  if (error) {
    console.error('Supabase subscribeToNewsletter error:', error.message);
    return error.message;
  }
  return null;
}

/** Staff/admin only -- loads the full subscriber list. Returns null if Supabase isn't configured, the request fails, or the caller lacks permission. */
export async function fetchNewsletterSubscribersFromDb(): Promise<NewsletterSubscriber[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase fetchNewsletterSubscribersFromDb error:', error.message);
    return null;
  }
  return (data as SubscriberRow[]).map(fromRow);
}

/** Staff/admin only -- removes a subscriber. Returns null on success, or an error message on failure/not-configured. */
export async function deleteNewsletterSubscriberFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteNewsletterSubscriberFromDb error:', error.message);
    return error.message;
  }
  return null;
}
