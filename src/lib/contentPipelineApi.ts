import { getSupabase, isSupabaseConfigured, resolveAmbiguousDeleteResult } from './supabase';
import { ContentPipelineItem } from '../types';

// Maps between the app's camelCase ContentPipelineItem shape and the
// snake_case `content_pipeline` table columns (see supabase-setup.sql).

interface ContentPipelineRow {
  id: string;
  title: string;
  author: string;
  role: string;
  date: string;
  status: string;
  platform: string[] | null;
  media_preview_url: string;
  notes: string;
  publish_time_minutes: number | null;
  revision_note: string | null;
}

function toRow(item: ContentPipelineItem): ContentPipelineRow {
  return {
    id: item.id,
    title: item.title,
    author: item.capturedBy,
    role: item.role,
    date: item.date,
    status: item.status,
    platform: item.platform,
    media_preview_url: item.mediaPreviewUrl,
    notes: item.notes,
    publish_time_minutes: item.publishTimeMinutes ?? null,
    revision_note: item.revisionNote || null
  };
}

function fromRow(row: ContentPipelineRow): ContentPipelineItem {
  return {
    id: row.id,
    title: row.title,
    capturedBy: row.author,
    role: row.role,
    date: row.date,
    status: row.status as ContentPipelineItem['status'],
    platform: (row.platform || []) as ContentPipelineItem['platform'],
    mediaPreviewUrl: row.media_preview_url,
    notes: row.notes,
    publishTimeMinutes: row.publish_time_minutes ?? undefined,
    revisionNote: row.revision_note || undefined
  };
}

/**
 * Loads all content pipeline drafts from Supabase, newest first.
 * Returns null (rather than throwing) if Supabase isn't configured or the
 * request fails, so callers can fall back to local mock data without crashing.
 */
export async function fetchContentPipelineFromDb(): Promise<ContentPipelineItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('content_pipeline')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase fetchContentPipelineFromDb error:', error.message);
    return null;
  }

  return (data as ContentPipelineRow[]).map(fromRow);
}

/** Writes a newly-created content pipeline item to Supabase. Returns null on success, or an error message string on failure/not-configured. */
export async function createContentPipelineInDb(item: ContentPipelineItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('content_pipeline').insert(toRow(item));
  if (error) {
    console.error('Supabase createContentPipelineInDb error:', error.message);
    return error.message;
  }
  return null;
}

/**
 * Updates an existing content pipeline item's row in Supabase by id. Returns
 * null on success, or an error message string on failure/not-configured.
 * Uses `.select()` to detect a silent 0-rows-affected no-op (RLS block or a
 * stale id) instead of reporting false success -- see the longer comment on
 * updateArticleInDb in articlesApi.ts for why this matters.
 */
export async function updateContentPipelineInDb(item: ContentPipelineItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { data, error } = await supabase.from('content_pipeline').update(toRow(item)).eq('id', item.id).select('id');
  if (error) {
    console.error('Supabase updateContentPipelineInDb error:', error.message);
    return error.message;
  }
  if (!data || data.length === 0) {
    console.error('Supabase updateContentPipelineInDb: 0 rows affected for id', item.id);
    return 'Approval did not save — no matching row was found or you may not have permission to edit this draft. It will look approved now but WILL revert on refresh.';
  }
  return null;
}

/** Deletes a content pipeline row from Supabase by id. Returns null on success, or an error message string on failure/not-configured. */
export async function deleteContentPipelineFromDb(itemId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { data, error } = await supabase.from('content_pipeline').delete().eq('id', itemId).select('id');
  if (error) {
    console.error('Supabase deleteContentPipelineFromDb error:', error.message);
    return error.message;
  }
  if (!data || data.length === 0) {
    console.error('Supabase deleteContentPipelineFromDb: 0 rows affected for id', itemId, '-- checking whether it was already gone');
    return resolveAmbiguousDeleteResult(supabase, 'content_pipeline', 'id', itemId, 'content draft');
  }
  return null;
}
