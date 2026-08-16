import { describe, it, expect } from 'vitest';
import {
  determineNewArticleStatus,
  determineEditedArticleStatus,
  determineContentPipelineCaptureStatus,
  determineContentPipelineResubmitStatus,
  buildArticleFromApprovedDraft
} from './statusTransitions';
import { ContentPipelineItem } from '../types';

// --- Articles -----------------------------------------------------------

describe('determineNewArticleStatus', () => {
  it('publishes immediately for an admin', () => {
    expect(determineNewArticleStatus(true)).toBe('Published');
  });

  it('sends a non-admin (staff) submission to review, never published', () => {
    expect(determineNewArticleStatus(false)).toBe('In Review');
  });
});

describe('determineEditedArticleStatus', () => {
  it("an admin's edit keeps the article's current status untouched", () => {
    expect(determineEditedArticleStatus(true, 'Published')).toBe('Published');
    expect(determineEditedArticleStatus(true, 'Draft')).toBe('Draft');
    expect(determineEditedArticleStatus(true, 'In Review')).toBe('In Review');
  });

  it('a non-admin edit always sends the article back to review, even if it was already Published', () => {
    // This is the exact rule that stops a "quick tweak" from slipping a
    // change past review on an already-live post.
    expect(determineEditedArticleStatus(false, 'Published')).toBe('In Review');
    expect(determineEditedArticleStatus(false, 'Draft')).toBe('In Review');
  });
});

// --- Content Pipeline -----------------------------------------------------

describe('determineContentPipelineCaptureStatus', () => {
  it('an admin capturing content publishes it immediately', () => {
    expect(determineContentPipelineCaptureStatus('admin')).toBe('Published');
  });

  it('staff and guest captures always go to the approval queue, never straight to Published', () => {
    // Regression test for a real historical bug: this used to auto-publish
    // for anyone with the IT_LEAD staff *role*, conflating role with
    // account type. Every non-admin account type must land here.
    expect(determineContentPipelineCaptureStatus('staff')).toBe('Pending SE Approval');
    expect(determineContentPipelineCaptureStatus('guest')).toBe('Pending SE Approval');
  });
});

describe('determineContentPipelineResubmitStatus', () => {
  it('a non-admin fixing their own "Needs Revision" draft resubmits it for approval', () => {
    expect(determineContentPipelineResubmitStatus('Needs Revision', 'staff')).toBe('Pending SE Approval');
    expect(determineContentPipelineResubmitStatus('Needs Revision', 'guest')).toBe('Pending SE Approval');
  });

  it('an admin editing a "Needs Revision" draft does NOT trigger a resubmit -- status stays as-is', () => {
    // An admin editing is "tidying up", not the submitter addressing
    // feedback -- it must not be treated as a resubmit.
    expect(determineContentPipelineResubmitStatus('Needs Revision', 'admin')).toBe('Needs Revision');
  });

  it('editing a draft in any other status never changes it, regardless of who edits', () => {
    expect(determineContentPipelineResubmitStatus('Draft Captured', 'staff')).toBe('Draft Captured');
    expect(determineContentPipelineResubmitStatus('Pending SE Approval', 'staff')).toBe('Pending SE Approval');
    expect(determineContentPipelineResubmitStatus('Published', 'admin')).toBe('Published');
    // Editing does not itself approve/publish anything, even for an admin.
    expect(determineContentPipelineResubmitStatus('Pending SE Approval', 'admin')).toBe('Pending SE Approval');
  });

  it('the full revision cycle never gets stuck and never skips straight to Published', () => {
    // submit -> pending -> admin requests changes -> Needs Revision ->
    // submitter resubmits -> Pending SE Approval again (not back to
    // Published, not stuck on Needs Revision).
    let status: ContentPipelineItem['status'] = determineContentPipelineCaptureStatus('staff');
    expect(status).toBe('Pending SE Approval');

    status = 'Needs Revision'; // admin requests changes (a separate action, not this function's job)
    status = determineContentPipelineResubmitStatus(status, 'staff');
    expect(status).toBe('Pending SE Approval');
  });
});

describe('buildArticleFromApprovedDraft', () => {
  const draft: ContentPipelineItem = {
    id: 'cp-123',
    title: 'Drone Footage of Villa Construction',
    capturedBy: 'Dilshan Perera (SE Lead)',
    role: 'IT_LEAD',
    date: '01/01/2026, 10:00',
    status: 'Pending SE Approval',
    platform: ['Instagram', 'Facebook'],
    mediaPreviewUrl: 'https://example.com/preview.jpg',
    notes: 'Official 4K drone footage.',
    publishTimeMinutes: 5
  };

  it('always publishes the resulting article as Published', () => {
    const article = buildArticleFromApprovedDraft(draft, undefined, '15 Aug 2026');
    expect(article.status).toBe('Published');
  });

  it('carries the draft\'s content, author, and platform tags across', () => {
    const article = buildArticleFromApprovedDraft(draft, 'https://example.com/avatar.jpg', '15 Aug 2026');
    expect(article.title).toBe(draft.title);
    expect(article.content).toBe(draft.notes);
    expect(article.author).toBe(draft.capturedBy);
    expect(article.authorRole).toBe(draft.role);
    expect(article.authorAvatarUrl).toBe('https://example.com/avatar.jpg');
    expect(article.coverImageUrl).toBe(draft.mediaPreviewUrl);
    expect(article.tags).toEqual(draft.platform);
    expect(article.category).toBe('Press Release');
  });

  it('is deterministic: the same draft always produces the same article id', () => {
    // This determinism is exactly what lets the database's own primary-key
    // uniqueness constraint safely reject a second, near-simultaneous
    // approval attempt (double-click, or two admins approving in different
    // tabs) as a harmless no-op instead of creating a duplicate article.
    const first = buildArticleFromApprovedDraft(draft, undefined, '15 Aug 2026');
    const second = buildArticleFromApprovedDraft(draft, undefined, '15 Aug 2026');
    expect(first.id).toBe(second.id);
    expect(first.id).toBe(`article-from-cp-${draft.id}`);
  });

  it('produces a different id for a different draft', () => {
    const otherDraft: ContentPipelineItem = { ...draft, id: 'cp-456' };
    const a = buildArticleFromApprovedDraft(draft, undefined, '15 Aug 2026');
    const b = buildArticleFromApprovedDraft(otherDraft, undefined, '15 Aug 2026');
    expect(a.id).not.toBe(b.id);
  });
});
