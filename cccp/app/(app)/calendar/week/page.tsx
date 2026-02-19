import { sql } from "../../../../lib/db";

type Item = {
  type: "session" | "booking";
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes?: number | null;
  client_name: string;
  client_email?: string | null;
};

async function getWeekItems(): Promise<Item[]> {
  const [sessions, bookings] = await Promise.all([
    sql`
      SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, c.name AS client_name, c.email AS client_email
      FROM sessions s
      JOIN clients c ON c.id = s.client_id
      WHERE s.scheduled_at IS NOT NULL
        AND s.scheduled_at::date >= date_trunc('week', CURRENT_DATE)
        AND s.scheduled_at::date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      ORDER BY s.scheduled_at ASC
    `,
    sql`
      SELECT id, scheduled_at, duration_minutes, name, email
      FROM bookings
      WHERE status != 'cancelled'
        AND scheduled_at::date >= date_trunc('week', CURRENT_DATE)
        AND scheduled_at::date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      ORDER BY scheduled_at ASC
    `
  ]);

  const sessionItems = (sessions as Item[]).map((s) => ({ ...s, type: "session" as const }));
  const bookingItems = (bookings as { id: string; scheduled_at: string; duration_minutes: number; name: string; email: string }[]).map((b) => ({
    type: "booking" as const,
    id: b.id,
    title: "Úvodní call",
    scheduled_at: b.scheduled_at,
    duration_minutes: b.duration_minutes,
    client_name: b.name,
    client_email: b.email
  }));
  return [...sessionItems, ...bookingItems].sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
}

export default async function CalendarWeekPage() {
  const items = await getWeekItems();

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Týdenní přehled
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Schůzky a rezervace v aktuálním týdnu.
      </p>
      <section className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">V tomto týdnu nemáš žádné schůzky ani rezervace.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {items.map((s) => (
              <div
                key={s.type === "session" ? s.id : `b-${s.id}`}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  s.type === "booking" ? "bg-amber-50 ring-1 ring-amber-200/60" : "bg-slate-50"
                }`}
              >
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {s.scheduled_at
                      ? new Date(s.scheduled_at).toLocaleString("cs-CZ", {
                          weekday: "short",
                          day: "numeric",
                          month: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Bez data"}
                    {s.type === "booking" ? (
                      <span className="ml-1.5 rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                        Rezervace
                      </span>
                    ) : null}
                  </div>
                  <div className="font-semibold text-slate-900">{s.title}</div>
                </div>
                <div className="text-xs text-slate-500">
                  <div className="font-medium text-slate-800">{s.client_name}</div>
                  {s.client_email ? <div>{s.client_email}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
