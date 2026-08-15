import { getSupabase, isSupabaseConfigured } from './supabase';
import { ActivityLogEntry } from '../types';

interface ActivityLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_title: string;
  detail: string | null;
  created_at: string;
}

function fromRow(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id || undefined,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    targetTitle: row.target_title,
    detail: row.detail || undefined,
    createdAt: row.created_at
  };
}

/** Loads the most recent activity log entries, newest first. Staff/admin only, per RLS. */
export async function fetchActivityLogFromDb(limit = 200): Promise<ActivityLogEntry[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Supabase fetchActivityLogFromDb error:', error.message);
    return null;
  }
  return (data as ActivityLogRow[]).map(fromRow);
}

/**
 * Records one activity log entry. Fire-and-forget by design (callers don't
 * await this) -- a logging failure should never block or fail the actual
 * action it's describing. Errors are only logged to the console.
 */
export function logActivity(entry: {
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetTitle: string;
  detail?: string;
}): void {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabase();
  if (!supabase) return;

  supabase
    .from('activity_log')
    .insert({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actor_id: entry.actorId || null,
      actor_name: entry.actorName,
      actor_role: entry.actorRole,
      action: entry.action,
      target_type: entry.targetType,
      target_title: entry.targetTitle,
      detail: entry.detail || null
    })
    .then(({ error }) => {
      if (error) console.error('logActivity insert error:', error.message);
    });
}
