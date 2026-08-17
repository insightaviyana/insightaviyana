/**
 * Shared email format validation. Native `type="email"` inputs already
 * give some validation, but browsers vary in strictness (some accept
 * "test@test" with no TLD) and it doesn't run until form submission in
 * every browser -- this gives an explicit, consistent check plus the
 * option to validate as the person types (see NewsletterSubscribe.tsx).
 *
 * Deliberately a simple, permissive pattern (not attempting full RFC 5322
 * compliance, which is notoriously over-strict and rejects real addresses)
 * -- just "looks like an email": something@something.tld.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
