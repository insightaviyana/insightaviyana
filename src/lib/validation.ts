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

/**
 * Site-wide input-shape guards (bug report: "numbers should only accept
 * numbers, letters-only fields should only accept letters"). Used as
 * onChange filters -- e.g. `onChange={e => setName(filterNameInput(e.target.value))}`
 * -- rather than only validating on submit, so a person typing "Nimali99"
 * into a Name field or "abc" into a Contact Number field simply can't get
 * the disallowed characters into the field at all, instead of discovering
 * the problem only after they hit Submit.
 *
 * Deliberately permissive within each category (keeps hyphens/apostrophes
 * for names like "O'Brien" or "Perera-Silva", keeps +, spaces, dashes,
 * and parentheses for phone numbers like "+94 (77) 123-4567") -- the goal
 * is blocking the *wrong kind* of character, not enforcing a rigid format.
 */

/** Strips digits and most symbols from free-text name input. Keeps letters
 * (including accented/Sinhala/Unicode letters), spaces, hyphens, apostrophes,
 * and periods (for initials like "D. Perera"). */
export function filterNameInput(value: string): string {
  return value.replace(/[0-9!@#$%^&*_+=[\]{}|\\/<>~`"]/g, '');
}

/** Strips letters from phone/contact-number input. Keeps digits, +, spaces,
 * hyphens, and parentheses. */
export function filterPhoneInput(value: string): string {
  return value.replace(/[^0-9+\-() ]/g, '');
}

/** Strips non-digit characters entirely (for pure numeric fields, e.g. a
 * ticket/OTP code). */
export function filterDigitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/** True if the string is empty/whitespace-only, or contains only letters,
 * spaces, hyphens, apostrophes, and periods -- for final submit-time checks
 * on a Name field (a filtered onChange already stops most bad input, but a
 * pasted value should still be caught). */
export function isValidName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[\p{L} .'-]+$/u.test(trimmed);
}

/** True if the string contains at least a few digits and no letters -- a
 * loose "looks like a phone number" check for final submit-time validation. */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/[a-zA-Z]/.test(trimmed)) return false;
  return (trimmed.match(/[0-9]/g) || []).length >= 7;
}
