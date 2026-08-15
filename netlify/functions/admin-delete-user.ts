import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // BUG FIX: previously only the delete-user call itself was wrapped in
  // try/catch -- an unexpected exception anywhere in the auth/permission
  // checks above it (a Supabase SDK network hiccup, a malformed token, etc.)
  // would crash the function uncaught. Netlify then returns a raw 502 with
  // a non-JSON body, which the frontend can only report as "unexpected
  // response, not JSON" -- not a real diagnosis. Wrapping the whole handler
  // means any such failure now returns a clean, readable JSON error instead.
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Server missing SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_URL env vars.' }) };
    }

    const authHeader = event.headers.authorization || event.headers.Authorization;
    const callerToken = authHeader?.replace('Bearer ', '');
    if (!callerToken) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing auth token.' }) };
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      // Netlify Functions' runtime doesn't reliably expose the native
      // WebSocket global @supabase/supabase-js's Realtime client needs --
      // even though this function never uses realtime, just calling
      // createClient() initializes that client internally and throws
      // "Node.js detected but native WebSocket not found" the moment it's
      // invoked. Providing the `ws` package here works around it
      // regardless of what Node version Netlify actually runs functions on
      // (NODE_VERSION in netlify.toml affects the build, not reliably the
      // Functions runtime).
      realtime: { transport: WebSocket as any }
    });

    const { data: callerData, error: callerError } = await adminClient.auth.getUser(callerToken);
    if (callerError || !callerData.user) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid or expired session.' }) };
    }

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('account_type')
      .eq('id', callerData.user.id)
      .single();

    if (!callerProfile || callerProfile.account_type !== 'admin') {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Only admins can delete accounts.' }) };
    }

    const { userId } = JSON.parse(event.body || '{}');
    if (!userId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'userId is required.' }) };
    }
    if (userId === callerData.user.id) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: "You can't delete your own account while signed in." }) };
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: deleteError.message }) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (err: any) {
    console.error('admin-delete-user unexpected error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message || 'Unexpected server error.' }) };
  }
};
