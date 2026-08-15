import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// This function must only ever run server-side (Netlify Function), never in
// the browser bundle -- it's the one place SUPABASE_SERVICE_ROLE_KEY is used.
// It verifies the caller is an authenticated admin before doing anything.

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Same fix as admin-delete-user.ts: wrap the ENTIRE handler, not just the
  // create-user call, so an unexpected exception in the auth/permission
  // checks above it returns a clean JSON error instead of a raw 502 crash.
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
      // Same fix as admin-delete-user.ts -- see the comment there.
      realtime: { transport: WebSocket as any }
    });

    // Verify the caller is who their token says they are, then check they're an admin.
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
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Only admins can create staff/admin accounts.' }) };
    }

    const { email, password, name, accountType, staffRole, title } = JSON.parse(event.body || '{}');
    if (!email || !password || !name) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'email, password, and name are required.' }) };
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createError || !created.user) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: createError?.message || 'Failed to create user.' }) };
    }

    // The DB trigger auto-creates a default 'guest' profile row on signup;
    // immediately correct it to the account type/role the admin chose.
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        name,
        account_type: accountType || 'staff',
        staff_role: staffRole || null,
        title: title || null
      })
      .eq('id', created.user.id);

    if (profileError) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `User created but profile setup failed: ${profileError.message}` }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, userId: created.user.id })
    };
  } catch (err: any) {
    console.error('admin-create-user unexpected error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message || 'Unexpected server error.' }) };
  }
};
