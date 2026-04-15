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
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  try {
    const body = await req.json();
    const { user_id, action } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders });
    }

    const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !user?.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
    }

    // ── PULL: return server data ──
    if (action === 'pull') {
      const { data: existing } = await supabase
        .from('user_data')
        .select('progress, stats, spaced_repetition, checkpoints')
        .eq('user_id', user_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        progress: existing?.progress ?? {},
        stats: existing?.stats ?? {},
        spaced_repetition: existing?.spaced_repetition ?? {},
        checkpoints: existing?.checkpoints ?? {},
      }), { headers: corsHeaders });
    }

    // ── PUSH: merge progress additively, overwrite stats ──
    // Progress & spaced_repetition: server keeps all existing entries,
    // client entries are added/updated on top (completed lessons never disappear).
    // Checkpoints: client version wins (latest device state).
    // Stats: client version wins (last writer).
    if (action === 'push') {
      const { progress, stats, spaced_repetition, checkpoints } = body;

      // Read current server state
      const { data: existing } = await supabase
        .from('user_data')
        .select('progress, spaced_repetition')
        .eq('user_id', user_id)
        .single();

      // Merge progress: server base + client on top (client wins per-key)
      const mergedProgress = {
        ...(existing?.progress ?? {}),
        ...(progress ?? {}),
      };

      // Merge spaced_repetition: same additive approach
      const mergedSR = {
        ...(existing?.spaced_repetition ?? {}),
        ...(spaced_repetition ?? {}),
      };

      // Remove checkpoints for completed lessons
      const cleanCheckpoints = { ...(checkpoints ?? {}) };
      for (const key of Object.keys(cleanCheckpoints)) {
        if (mergedProgress[key]?.completed) {
          delete cleanCheckpoints[key];
        }
      }

      const { error: upsertError } = await supabase.from('user_data').upsert(
        {
          user_id,
          progress: mergedProgress,
          stats: stats ?? {},
          spaced_repetition: mergedSR,
          checkpoints: cleanCheckpoints,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "pull" or "push".' }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error('Sync error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});
