import { getAdminSupabase } from '@web/lib/supabase-admin';
import { Users as UsersIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const db = getAdminSupabase();
  const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 50 });
  const { data: userDataRows } = await db
    .from('user_data')
    .select('user_id, stats, updated_at');

  const statsByUser = new Map<string, { total_xp?: number; current_streak?: number; last_activity_date?: string }>();
  for (const row of userDataRows ?? []) {
    statsByUser.set(row.user_id, (row.stats ?? {}) as Record<string, unknown>);
  }

  const users = (authUsers?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    stats: statsByUser.get(u.id) ?? {},
  }));

  users.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div>
      <header className="mb-lg">
        <h1 className="text-2xl font-extrabold text-ink-primary">Uživatelé</h1>
        <p className="mt-xs text-sm text-ink-secondary">
          Posledních {users.length} registrovaných uživatelů.
        </p>
      </header>

      {users.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-card p-xl text-center">
          <UsersIcon className="mx-auto h-10 w-10 text-ink-muted" />
          <p className="mt-md text-sm text-ink-muted">Zatím žádní uživatelé.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-[#E5E7EB] bg-card shadow-[2px_4px_0_0_#D1D5DB]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#E5E7EB] bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <th className="px-md py-sm">E-mail</th>
                <th className="px-md py-sm">Registrace</th>
                <th className="px-md py-sm text-right">XP</th>
                <th className="px-md py-sm text-right">Série</th>
                <th className="px-md py-sm">Poslední aktivita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {users.map((u) => {
                const s = u.stats as Record<string, unknown>;
                return (
                  <tr key={u.id}>
                    <td className="px-md py-sm font-bold text-ink-primary">{u.email}</td>
                    <td className="px-md py-sm text-ink-secondary">
                      {new Date(u.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-md py-sm text-right text-ink-primary">
                      {typeof s.total_xp === 'number' ? s.total_xp.toLocaleString() : '—'}
                    </td>
                    <td className="px-md py-sm text-right text-ink-primary">
                      {typeof s.current_streak === 'number' ? s.current_streak : '—'}
                    </td>
                    <td className="px-md py-sm text-ink-secondary">
                      {typeof s.last_activity_date === 'string' ? s.last_activity_date : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
