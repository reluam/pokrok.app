/**
 * Server-as-source-of-truth sync.
 * - pull: download server state → overwrite local
 * - push: upload local state → overwrite server
 */

function getSupabaseUrl(): string {
  try { if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL; } catch {}
  try { if (process.env.EXPO_PUBLIC_SUPABASE_URL) return process.env.EXPO_PUBLIC_SUPABASE_URL; } catch {}
  return '';
}

export interface UserData {
  progress: Record<string, any>;
  stats: Record<string, any>;
  spaced_repetition: Record<string, any>;
  checkpoints: Record<string, any>;
}

const EMPTY_DATA: UserData = { progress: {}, stats: {}, spaced_repetition: {}, checkpoints: {} };

/** Pull server data. Returns null on failure. */
export async function pullFromServer(userId: string): Promise<UserData | null> {
  const url = getSupabaseUrl();
  if (!url || !userId || userId === 'demo-user') return null;

  try {
    const res = await fetch(`${url}/functions/v1/sync-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pull', user_id: userId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return {
      progress: data.progress ?? {},
      stats: data.stats ?? {},
      spaced_repetition: data.spaced_repetition ?? {},
      checkpoints: data.checkpoints ?? {},
    };
  } catch {
    return null;
  }
}

/** Push local data to server. Returns true on success. */
export async function pushToServer(userId: string, data: UserData): Promise<boolean> {
  const url = getSupabaseUrl();
  if (!url || !userId || userId === 'demo-user') return false;

  try {
    const res = await fetch(`${url}/functions/v1/sync-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'push',
        user_id: userId,
        ...data,
      }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}
