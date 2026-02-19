import { sql } from "../../../lib/db";

type SessionRow = {
  id: string;
  client_id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  client_name: string;
  client_email: string | null;
};

type BookingRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  name: string;
  email: string;
};

async function getUpcomingSessions(): Promise<SessionRow[]> {
  const rows = await sql<SessionRow[]>`
    SELECT
      s.id,
      s.client_id,
      s.title,
      s.scheduled_at,
      s.duration_minutes,
      c.name AS client_name,
      c.email AS client_email
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    WHERE s.scheduled_at IS NOT NULL
    ORDER BY s.scheduled_at ASC
    LIMIT 50
  `;

  return rows;
}

async function getUpcomingBookings(): Promise<BookingRow[]> {
  const rows = await sql<BookingRow[]>`
    SELECT id, scheduled_at, duration_minutes, name, email
    FROM bookings
    WHERE status != 'cancelled'
    ORDER BY scheduled_at ASC
    LIMIT 50
  `;
  return rows;
}

export default async function CalendarPage() {
  const [sessions, bookings] = await Promise.all([
    getUpcomingSessions(),
    getUpcomingBookings()
  ]);

  const allItems = [
    ...sessions.map((s) => ({ type: "session" as const, ...s })),
    ...bookings.map((b) => ({
      type: "booking" as const,
      id: b.id,
      title: "Úvodní call",
      scheduled_at: b.scheduled_at,
      duration_minutes: b.duration_minutes,
      client_name: b.name,
      client_email: b.email
    }))
  ].sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));

  return (
    <div className="py-2">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Kalendář
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Jednoduchý přehled schůzek s klienty – zatím jako seznam, později
            týdenní / měsíční grid.
          </p>
        </div>
        <div className="inline-flex gap-2 rounded-full bg-slate-100 p-1 text-xs text-slate-600">
          <button className="rounded-full bg-white px-3 py-1 font-medium shadow-sm">
            Týden
          </button>
          <button className="rounded-full px-3 py-1">Měsíc</button>
        </div>
      </div>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        {allItems.length === 0 ? (
          <p className="text-xs text-slate-500">
            Zatím tu nejsou žádné schůzky ani rezervace. Brzy sem přidáme tlačítko „Nová
            schůzka“ napojené na konkrétního klienta.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {allItems.map((s) => (
              <div
                key={s.type === "session" ? s.id : `b-${s.id}`}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  s.type === "booking"
                    ? "bg-amber-50 ring-1 ring-amber-200/60"
                    : "bg-slate-50"
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
                  <div className="text-sm font-semibold text-slate-900">
                    {s.title}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div className="font-medium text-slate-800">
                    {s.client_name}
                  </div>
                  <div>{s.client_email ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

