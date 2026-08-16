import { ArticleItem, ContentPipelineItem } from '../types';

/**
 * Pure business-logic functions that decide what status/approval-state a
 * piece of content gets, given who's acting on it. Extracted from inline
 * ternaries in component event handlers as part of Priority 2
 * (NEXT_SESSION_PLAN.md).
 *
 * Why this file exists: this project has hit the same bug shape multiple
 * times -- an approval-gating rule ("only an admin's write may publish")
 * implemented once, then re-implemented slightly differently somewhere
 * else, with the two versions silently drifting apart (see
 * `determineFactCheckApprovalStatus` in factCheckStatus.ts for the first
 * instance of this pattern, and the plan's Priority 2 section for the six
 * separate historical bugs this exact shape caused). Pulling the rule into
 * one pure, exported function per content type means every call site uses
 * the literal same logic, and that logic can be unit-tested in isolation
 * without rendering any component or touching Supabase -- see
 * src/lib/__tests__/statusTransitions.test.ts.
 *
 * These are UI/optimistic-update helpers only. The actual security
 * boundary is each table's Supabase RLS policy (see supabase-setup.sql) --
 * these functions must never be treated as the enforcement layer.
 */

type AccountType = 'admin' | 'staff' | 'guest';

// --- Articles ---------------------------------------------------------

/**
 * What status a NEW article should get when published/saved.
 * Admins publish straight to the public site; everyone else's post goes to
 * "In Review" until an admin approves it.
 */
export function determineNewArticleStatus(isAdmin: boolean): ArticleItem['status'] {
  return isAdmin ? 'Published' : 'In Review';
}

/**
 * What status an EXISTING article keeps after being edited.
 * An admin's edit keeps the article's current status as-is (an admin can
 * already publish directly, so there's nothing to gate). Anyone else's
 * edit sends it back to "In Review" so a "quick tweak" can't be used to
 * slip a change past review on an already-published post.
 */
export function determineEditedArticleStatus(isAdmin: boolean, originalStatus: ArticleItem['status']): ArticleItem['status'] {
  return isAdmin ? originalStatus : 'In Review';
}

// --- Content Pipeline drafts -------------------------------------------

/**
 * What status a NEWLY CAPTURED content-pipeline draft gets.
 * An admin capturing content publishes it immediately; anyone else's
 * capture goes into the SE-approval queue.
 */
export function determineContentPipelineCaptureStatus(accountType: AccountType): ContentPipelineItem['status'] {
  return accountType === 'admin' ? 'Published' : 'Pending SE Approval';
}

/**
 * What status a content-pipeline draft gets after being saved/edited.
 * Specifically handles the "resubmit" case: if the person editing is the
 * one fixing their OWN "Needs Revision" draft (and isn't an admin), it goes
 * back into the approval queue as "Pending SE Approval". Any other edit
 * (including any edit made by an admin) leaves the current status
 * untouched -- editing a draft is not itself an approval action.
 */
export function determineContentPipelineResubmitStatus(
  currentStatus: ContentPipelineItem['status'],
  editorAccountType: AccountType
): ContentPipelineItem['status'] {
  const isSelfResubmit = currentStatus === 'Needs Revision' && editorAccountType !== 'admin';
  return isSelfResubmit ? 'Pending SE Approval' : currentStatus;
}

/**
 * Builds the real, published ArticleItem that approving a content-pipeline
 * draft creates (Announcements/Public Hub only ever read from the articles
 * list, so approving a draft has to actually create one of these for the
 * approved content to be findable anywhere -- this is the exact bug this
 * project hit before: approval flipped the draft's own status but never
 * created anything visible).
 *
 * Pure and deterministic: the same draft always produces an article with
 * the same id (`article-from-cp-${draftId}`), which is what lets the
 * database's own primary-key uniqueness constraint safely reject a second,
 * near-simultaneous approval attempt (e.g. a double-click, or two admins
 * approving the same draft in different tabs) as a harmless no-op instead
 * of creating a duplicate article.
 */
export function buildArticleFromApprovedDraft(
  draft: ContentPipelineItem,
  matchedAuthorAvatarUrl: string | undefined,
  approvedOnDate: string = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
): ArticleItem {
  return {
    id: `article-from-cp-${draft.id}`,
    title: draft.title,
    subtitle: `Captured via Content Pipeline — ${draft.platform.join(', ')}`,
    category: 'Press Release',
    author: draft.capturedBy,
    authorRole: draft.role,
    authorAvatarUrl: matchedAuthorAvatarUrl,
    date: approvedOnDate,
    content: draft.notes,
    coverImageUrl: draft.mediaPreviewUrl,
    mediaType: 'image',
    status: 'Published',
    viewsCount: 0,
    tags: draft.platform
  };
}
