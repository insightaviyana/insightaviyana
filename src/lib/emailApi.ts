// Calls the send-notification-email Netlify Function so form submissions
// (inquiries, scholarship applications, etc.) actually land in an inbox,
// instead of relying on a `mailto:` link opening the *visitor's* own email
// client (which does nothing if they don't have one set up -- common on
// mobile). See netlify/functions/send-notification-email.ts for the
// server-side half and required env vars (RESEND_API_KEY).
//
// Returns null on success, or an error message string on failure. Callers
// should treat failure as non-fatal -- the in-app record (DB row / local
// state) is still the primary record; email is a courtesy notification.

interface SendEmailParams {
  subject: string;
  replyTo?: string;
  htmlBody?: string;
  textBody?: string;
  /** Overrides the default staff inbox recipient -- e.g. to send a
   * confirmation receipt directly to a member of the public. */
  to?: string;
  /** Optional file attachments (e.g. a candidate's CV). `content` must be
   * base64-encoded (no `data:` prefix) -- see fileToBase64() in cvUpload.ts. */
  attachments?: { filename: string; content: string }[];
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<string | null> {
  try {
    const response = await fetch('/api/notify/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      let errorMsg: string = data.error || `Email send failed (${response.status})`;
      // Resend's shared/unverified `onboarding@resend.dev` sender can only
      // deliver to the Resend account's own verified email address until a
      // real sending domain is verified. This is the #1 cause of "the staff
      // notification arrives fine, but the visitor's confirmation email
      // never does" -- recognizable by a 403 mentioning "testing emails" or
      // "own email address". Surface it as an actionable message rather
      // than a generic failure, since retrying won't fix it.
      if (/only send testing emails|verify a domain|own email address/i.test(errorMsg)) {
        errorMsg = `Resend account isn't verified for a sending domain yet, so this can only be delivered to "${params.to ? 'the recipient' : 'the staff inbox'}" if that address matches the Resend account owner. Verify a domain at resend.com/domains and set SENDER_EMAIL to fix this for all recipients. (Original: ${errorMsg})`;
      }
      console.error(`sendNotificationEmail failed [to=${params.to || 'default staff inbox'}]:`, errorMsg);
      return errorMsg;
    }

    return null;
  } catch (err) {
    // Most commonly: running under plain `npm run dev` (no Netlify Functions
    // available) rather than `netlify dev` -- see PROJECT_HANDOFF.md.
    const msg = err instanceof Error ? err.message : 'Email send failed';
    console.error(`sendNotificationEmail failed [to=${params.to || 'default staff inbox'}]:`, msg);
    return msg;
  }
}
