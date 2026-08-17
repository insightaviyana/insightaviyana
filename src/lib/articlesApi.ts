import { getSupabase, isSupabaseConfigured, resolveAmbiguousDeleteResult } from './supabase';
import { ArticleItem } from '../types';

// Maps between the app's camelCase ArticleItem shape and the
// snake_case `announcements` table columns (see the schema comment
// in supabase.ts / the Supabase modal for the exact DDL).

interface AnnouncementRow {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  author_role: string;
  author_avatar_url: string | null;
  date: string;
  content: string;
  cover_image_url: string | null;
  media_type: string | null;
  video_url: string | null;
  video_caption: string | null;
  status: string;
  views_count: number;
  featured: boolean;
  tags: string[] | null;
}

function toRow(article: ArticleItem): AnnouncementRow {
  return {
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    author: article.author,
    author_role: article.authorRole,
    author_avatar_url: article.authorAvatarUrl || null,
    date: article.date,
    content: article.content,
    cover_image_url: article.coverImageUrl || null,
    media_type: article.mediaType || null,
    video_url: article.videoUrl || null,
    video_caption: article.videoCaption || null,
    status: article.status,
    views_count: article.viewsCount,
    featured: Boolean(article.featured),
    tags: article.tags
  };
}

function fromRow(row: AnnouncementRow): ArticleItem {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category as ArticleItem['category'],
    author: row.author,
    authorRole: row.author_role,
    authorAvatarUrl: row.author_avatar_url || undefined,
    date: row.date,
    content: row.content,
    coverImageUrl: row.cover_image_url || undefined,
    mediaType: (row.media_type as ArticleItem['mediaType']) || undefined,
    videoUrl: row.video_url || undefined,
    videoCaption: row.video_caption || undefined,
    status: row.status as ArticleItem['status'],
    viewsCount: row.views_count,
    featured: row.featured,
    tags: row.tags || []
  };
}

/**
 * Loads all articles from Supabase, newest first.
 * Returns null (rather than throwing) if Supabase isn't configured or the
 * request fails, so callers can fall back to local mock data without crashing.
 */
export async function fetchArticlesFromDb(): Promise<ArticleItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase fetchArticlesFromDb error:', error.message);
    return null;
  }

  return (data as AnnouncementRow[]).map(fromRow);
}

/** Writes a newly-created article to Supabase. Returns null on success, or an error message string on failure/not-configured. */
export async function createArticleInDb(article: ArticleItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('announcements').insert(toRow(article));
  if (error) {
    console.error('Supabase createArticleInDb error:', error.message);
    return error.message;
  }
  return null;
}

/**
 * Updates an existing article's row in Supabase by id. Returns null on
 * success, or an error message string on failure/not-configured.
 *
 * Uses `.upsert()` rather than `.update()` -- this used to be a plain
 * update, which meant an article that was added to local state (so it
 * looks completely normal in the UI) but whose original INSERT silently
 * failed or never landed (e.g. Supabase was briefly unreachable at
 * creation time) could never be edited afterwards: `UPDATE ... WHERE id =
 * X` finds zero matching rows for an id that was never actually inserted,
 * so every subsequent edit permanently failed with "no matching row was
 * found" -- a real, reported bug (confirmed on a real article whose first
 * save had silently failed). `.upsert()` self-heals this exact case by
 * inserting the row if it doesn't exist yet, instead of just failing.
 *
 * IMPORTANT: Supabase's `.update()`/`.upsert()` do NOT error when the RLS
 * policy silently blocks the write -- they just report success with an
 * empty result. That silent no-op was the original cause of "Approve &
 * Publish looks like it worked, but reverts after a refresh." Using
 * `.select()` here still forces Supabase to return the affected row(s) so
 * a genuine permission-denied case (as opposed to a missing-row case,
 * which upsert now fixes on its own) is still caught and reported rather
 * than silently pretending it worked.
 */
export async function updateArticleInDb(article: ArticleItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { data, error } = await supabase.from('announcements').upsert(toRow(article)).select('id');
  if (error) {
    console.error('Supabase updateArticleInDb error:', error.message);
    return error.message;
  }
  if (!data || data.length === 0) {
    const msg = 'Update did not save — you may not have permission to edit this article (e.g. only an admin can edit an already-published one). It will look updated now but WILL revert on refresh.';
    console.error('Supabase updateArticleInDb: 0 rows affected for id', article.id);
    return msg;
  }
  return null;
}

/** Deletes an article row from Supabase by id. Returns null on success, or an error message string on failure/not-configured. */
export async function deleteArticleFromDb(articleId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { data, error } = await supabase.from('announcements').delete().eq('id', articleId).select('id');
  if (error) {
    console.error('Supabase deleteArticleFromDb error:', error.message);
    return error.message;
  }
  if (!data || data.length === 0) {
    console.error('Supabase deleteArticleFromDb: 0 rows affected for id', articleId, '-- checking whether it was already gone');
    return resolveAmbiguousDeleteResult(supabase, 'announcements', 'id', articleId, 'article');
  }
  return null;
}
