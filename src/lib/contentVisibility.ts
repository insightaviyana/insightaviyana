import { ArticleItem } from '../types';

/**
 * Whether an article should be visible to a PUBLIC (non-staff) visitor
 * right now. An article can be marked `status: 'Published'` ahead of time
 * with `scheduledPublishAt` set to a future moment (an embargo) -- staff
 * still see it immediately everywhere so it can be reviewed before the
 * embargo lifts, but every public-facing list (Public Hub's unified feed,
 * Investment page, Careers page) should filter through this function
 * rather than checking `status === 'Published'` directly, or a scheduled
 * article would leak to the public the moment someone flips it to
 * Published, regardless of the intended release time.
 *
 * `asOf` defaults to "now" but takes an explicit Date so callers building
 * a list once per render don't each construct their own `new Date()` (and,
 * incidentally, so this is trivially testable without mocking the clock).
 */
export function isPubliclyVisible(article: Pick<ArticleItem, 'status' | 'scheduledPublishAt'>, asOf: Date = new Date()): boolean {
  if (article.status !== 'Published') return false;
  if (!article.scheduledPublishAt) return true;
  const scheduled = new Date(article.scheduledPublishAt);
  if (isNaN(scheduled.getTime())) return true; // malformed value -- fail open rather than hiding a real published article
  return scheduled <= asOf;
}

/** True if a 'Published' article's embargo hasn't lifted yet -- used to show
 * a "Scheduled for <date>" badge to staff (who see it immediately) instead
 * of the plain "Published" badge, so it's clear the piece isn't public yet. */
export function isScheduledForFuture(article: Pick<ArticleItem, 'status' | 'scheduledPublishAt'>, asOf: Date = new Date()): boolean {
  return article.status === 'Published' && !isPubliclyVisible(article, asOf);
}
