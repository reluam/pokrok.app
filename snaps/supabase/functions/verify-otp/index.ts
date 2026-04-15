import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    // Find valid code
    const { data: codes, error: fetchError } = await supabase
      .from('magic_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !codes || codes.length === 0) {
      return new Response(JSON.stringify({ error: 'Code expired or not found' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const magicCode = codes[0];

    // Check max attempts
    if (magicCode.attempts >= 5) {
      await supabase
        .from('magic_codes')
        .update({ used: true })
        .eq('id', magicCode.id);

      return new Response(JSON.stringify({ error: 'Too many attempts. Request a new code.' }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    // Increment attempts
    await supabase
      .from('magic_codes')
      .update({ attempts: magicCode.attempts + 1 })
      .eq('id', magicCode.id);

    // Verify code
    if (magicCode.code !== normalizedCode) {
      const remaining = 4 - magicCode.attempts;
      return new Response(JSON.stringify({
        error: `Invalid code. ${remaining} attempts remaining.`,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Mark code as used
    await supabase
      .from('magic_codes')
      .update({ used: true })
      .eq('id', magicCode.id);

    // Check if user exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === normalizedEmail
    );

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with a random password (they'll never use it)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: randomPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error('Create user error:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create user' }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      userId = newUser.user.id;
      isNewUser = true;
    }

    // Generate a session token for the user
    const { data: session, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
      });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      email: normalizedEmail,
      is_new_user: isNewUser,
      // Return the hashed token so client can exchange it for a session
      token_hash: session.properties?.hashed_token,
    }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
