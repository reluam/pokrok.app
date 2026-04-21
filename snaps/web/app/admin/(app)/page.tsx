import { Users, Activity, Trophy, Flame, BookOpen, Calendar } from 'lucide-react';
import { getAdminSupabase } from '@web/lib/supabase-admin';

export const dynamic = 'force-dynamic';

interface Stats {
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  avgXp: number;
  avgStreak: number;
  topLongestStreak: number;
  totalCompletedLessons: number;
  topLessons: { lesson_id: string; count: number }[];
  recentSignups: number;
}

async function loadStats(): Promise<Stats> {
  const db = getAdminSupabase();

  // Count auth.users by paginating listUsers (service-role required).
  // Max perPage is 1000; stop once a page returns fewer than that.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let totalUsers = 0;
  let recentSignups = 0;
  for (let page = 1; page <= 100; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    totalUsers += users.length;
    for (const u of users) {
      if (u.created_at && new Date(u.created_at).getTime() >= weekAgo) recentSignups++;
    }
    if (users.length < 1000) break;
  }

  // Pull everyone's user_data (stats + progress JSONB).
  const { data: userDataRows } = await db.from('user_data').select('stats, progress, updated_at');

  const today = new Date().toISOString().slice(0, 10);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let dau = 0;
  let wau = 0;
  let mau = 0;
  let xpSum = 0;
  let streakSum = 0;
  let streakCount = 0;
  let topLongestStreak = 0;
  let totalCompletedLessons = 0;
  const lessonCounts = new Map<string, number>();

  for (const row of userDataRows ?? []) {
    const stats = (row.stats ?? {}) as Record<string, unknown>;
    const progress = (row.progress ?? {}) as Record<string, { completed?: boolean; completed_at?: string; lesson_id?: string }>;

    if (typeof stats.total_xp === 'number') xpSum += stats.total_xp;
    if (typeof stats.current_streak === 'number') {
      streakSum += stats.current_streak;
      streakCount++;
    }
    if (typeof stats.longest_streak === 'number' && stats.longest_streak > topLongestStreak) {
      topLongestStreak = stats.longest_streak;
    }

    const lastActivity = stats.last_activity_date as string | undefined;
    if (lastActivity) {
      const d = new Date(lastActivity);
      if (d >= oneDayAgo || lastActivity === today) dau++;
      if (d >= sevenDaysAgo) wau++;
      if (d >= thirtyDaysAgo) mau++;
    }

    for (const [lessonId, p] of Object.entries(progress)) {
      if (p?.completed) {
        totalCompletedLessons++;
        lessonCounts.set(lessonId, (lessonCounts.get(lessonId) ?? 0) + 1);
      }
    }
  }

  const topLessons = Array.from(lessonCounts.entries())
    .map(([lesson_id, count]) => ({ lesson_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalUsers,
    dau,
    wau,
    mau,
    avgXp: streakCount > 0 ? Math.round(xpSum / (userDataRows?.length || 1)) : 0,
    avgStreak: streakCount > 0 ? Math.round((streakSum / streakCount) * 10) / 10 : 0,
    topLongestStreak,
    totalCompletedLessons,
    topLessons,
    recentSignups,
  };
}

export default async function AdminOverviewPage() {
  let stats: Stats | null = null;
  let error: string | null = null;
  try {
    stats = await loadStats();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <header className="mb-lg">
        <h1 className="text-2xl font-extrabold text-ink-primary">Přehled</h1>
        <p className="mt-xs text-sm text-ink-secondary">
          Jak lidi aplikaci používají. Data se načítají živě.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-md text-sm text-red-700">
          <p className="font-bold">Nepodařilo se načíst statistiky.</p>
          <p className="mt-xs text-xs">{error}</p>
          <p className="mt-xs text-xs">
            Zkontroluj, že je v env nastavené <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </p>
        </div>
      )}

      {stats && (
        <>
          <section className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Uživatelů" value={stats.totalUsers.toLocaleString()} hint={`+${stats.recentSignups} za 7 dní`} />
            <StatCard icon={<Activity className="h-5 w-5 text-teal" />} label="DAU" value={stats.dau.toLocaleString()} hint={`${stats.wau} za týden · ${stats.mau} za měsíc`} />
            <StatCard icon={<Trophy className="h-5 w-5 text-xp" />} label="Průměrné XP" value={stats.avgXp.toLocaleString()} />
            <StatCard icon={<Flame className="h-5 w-5 text-streak" />} label="Prům. série" value={`${stats.avgStreak}`} hint={`Nejlepší: ${stats.topLongestStreak}`} />
          </section>

          <section className="mt-lg grid gap-md lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-[#E5E7EB] bg-card p-lg shadow-[2px_4px_0_0_#D1D5DB]">
              <div className="flex items-center gap-sm">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-md font-extrabold text-ink-primary">Celkem dokončených lekcí</h2>
              </div>
              <p className="mt-sm text-3xl font-extrabold text-ink-primary">
                {stats.totalCompletedLessons.toLocaleString()}
              </p>
              <p className="mt-xs text-xs text-ink-muted">
                Napříč všemi uživateli.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-[#E5E7EB] bg-card p-lg shadow-[2px_4px_0_0_#D1D5DB]">
              <div className="flex items-center gap-sm">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-md font-extrabold text-ink-primary">Aktivita</h2>
              </div>
              <div className="mt-md space-y-xs">
                <ActivityRow label="Dnes (DAU)" value={stats.dau} total={stats.totalUsers} />
                <ActivityRow label="7 dní (WAU)" value={stats.wau} total={stats.totalUsers} />
                <ActivityRow label="30 dní (MAU)" value={stats.mau} total={stats.totalUsers} />
              </div>
            </div>
          </section>

          <section className="mt-lg rounded-2xl border-2 border-[#E5E7EB] bg-card p-lg shadow-[2px_4px_0_0_#D1D5DB]">
            <h2 className="text-md font-extrabold text-ink-primary">Nejpopulárnější lekce</h2>
            <p className="mt-xs text-xs text-ink-muted">Podle počtu dokončení.</p>
            {stats.topLessons.length === 0 ? (
              <p className="mt-md text-sm text-ink-muted">Zatím žádná data.</p>
            ) : (
              <ul className="mt-md divide-y divide-[#E5E7EB]">
                {stats.topLessons.map((l, i) => (
                  <li key={l.lesson_id} className="flex items-center justify-between py-sm">
                    <div className="flex items-center gap-sm">
                      <span className="w-6 text-xs font-bold text-ink-muted">#{i + 1}</span>
                      <code className="text-sm text-ink-primary">{l.lesson_id}</code>
                    </div>
                    <span className="text-sm font-bold text-ink-primary">{l.count}×</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border-2 border-[#E5E7EB] bg-card p-md shadow-[2px_4px_0_0_#D1D5DB]">
      <div className="flex items-center gap-sm">
        {icon}
        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      </div>
      <p className="mt-sm text-2xl font-extrabold text-ink-primary">{value}</p>
      {hint && <p className="mt-xs text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function ActivityRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-ink-secondary">
        <span>{label}</span>
        <span>
          {value} / {total} ({pct}%)
        </span>
      </div>
      <div className="mt-xs h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
