import { getSupabase, isSupabaseConfigured } from './supabase';
import { NotificationItem } from '../types';

// Maps between the app's camelCase NotificationItem shape and the
// snake_case `notifications` table columns. INSERT is open to everyone
// (even a logged-out visitor triggers one by submitting an inquiry); only
// staff/admin can read/update/delete, per RLS.

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: string;
  type: string;
  read: boolean;
  action_required: string | null;
  source_url: string | null;
}

function toRow(notif: NotificationItem): NotificationRow {
  return {
    id: notif.id,
    title: notif.title,
    message: notif.message,
    timestamp: notif.timestamp,
    severity: notif.severity,
    type: notif.type,
    read: notif.read,
    action_required: notif.actionRequired || null,
    source_url: notif.sourceUrl || null
  };
}

function fromRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    timestamp: row.timestamp,
    severity: row.severity as NotificationItem['severity'],
    type: row.type as NotificationItem['type'],
    read: row.read,
    actionRequired: row.action_required || undefined,
    sourceUrl: row.source_url || undefined
  };
}

/**
 * Loads all notifications from Supabase, newest first. Only succeeds for a
 * signed-in staff/admin account -- RLS returns an empty set for anyone else.
 */
export async function fetchNotificationsFromDb(): Promise<NotificationItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Supabase fetchNotificationsFromDb error:', error.message);
    return null;
  }

  return (data as NotificationRow[]).map(fromRow);
}

/** Writes a new notification to Supabase. Returns null on success, or an error message string on failure/not-configured. */
export async function createNotificationInDb(notif: NotificationItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('notifications').insert(toRow(notif));
  if (error) {
    console.error('Supabase createNotificationInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Marks one notification as read/unread in Supabase (staff/admin only, per RLS). */
export async function updateNotificationReadInDb(id: string, read: boolean): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('notifications').update({ read }).eq('id', id);
  if (error) {
    console.error('Supabase updateNotificationReadInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Marks every notification as read in Supabase (staff/admin only, per RLS). */
export async function markAllNotificationsReadInDb(): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
  if (error) {
    console.error('Supabase markAllNotificationsReadInDb error:', error.message);
    return error.message;
  }
  return null;
}
