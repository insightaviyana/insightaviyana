import type { Handler } from '@netlify/functions';

// Actually delivers an email to insight@aviyana.lk (or wherever RECIPIENT_EMAIL
// points), instead of relying on a `mailto:` link opening the *visitor's* own
// email client (which silently does nothing if they don't have one configured
// -- common on mobile). Uses Resend (https://resend.com) because it's a single
// HTTPS call with no SDK/dependency needed.
//
// Requires two Netlify environment variables:
//   RESEND_API_KEY   - from https://resend.com/api-keys (free tier is fine)
//   RECIPIENT_EMAIL  - defaults to insight@aviyana.lk if not set
//
// IMPORTANT: Resend's free tier only lets you send FROM a domain you've
// verified in your Resend account. Until aviyana.lk (or a subdomain) is
// verified there, use Resend's shared `onboarding@resend.dev` sender (works
// immediately, no domain setup) -- that's the default below.

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { subject, replyTo, htmlBody, textBody, to, attachments } = JSON.parse(event.body || '{}');
    const apiKey = process.env.RESEND_API_KEY;
    // `to` lets the caller send a confirmation directly to a member of the
    // public (e.g. the applicant's own email) instead of the default staff
    // inbox -- used for the "your application was received" receipt.
    const recipient = to || process.env.RECIPIENT_EMAIL || 'insight@aviyana.lk';

    if (!apiKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'RESEND_API_KEY environment variable is missing. See netlify/functions/send-notification-email.ts for setup notes.' })
      };
    }

    if (!subject || (!htmlBody && !textBody)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'subject and htmlBody/textBody are required' })
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.SENDER_EMAIL || 'Aviyana Insight <onboarding@resend.dev>',
        to: [recipient],
        reply_to: replyTo || undefined,
        subject,
        html: htmlBody,
        text: textBody,
        // Resend expects base64 content with no `data:` prefix -- see
        // fileToBase64() in src/lib/cvUpload.ts, which is what produces this.
        attachments: Array.isArray(attachments) && attachments.length > 0 ? attachments : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Email provider error: ${errorText}` })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('send-notification-email error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' })
    };
  }
};
