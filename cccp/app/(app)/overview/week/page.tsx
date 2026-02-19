import { sql } from "../../../../lib/db";

type Session = {
  id: string;
  title: string;
  scheduled_at: string;
  client_name: string;
};

type Booking = {
  id: string;
  scheduled_at: string;
  name: string;
  email: string;
};

type Lead = {
  id: string;
  name: string | null;
  email: string;
  status: string;
};

async function getWeekSessions(): Promise<Session[]> {
  const rows = await sql<Session[]>`
    SELECT
      s.id,
      s.title,
      s.scheduled_at,
      c.name AS client_name
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    WHERE
      s.scheduled_at::date >= date_trunc('week', CURRENT_DATE)
      AND s.scheduled_at::date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    ORDER BY s.scheduled_at ASC
  `;

  return rows;
}

async function getWeekBookings(): Promise<Booking[]> {
  const rows = await sql<Booking[]>`
    SELECT id, scheduled_at, name, email
    FROM bookings
    WHERE status != 'cancelled'
      AND scheduled_at::date >= date_trunc('week', CURRENT_DATE)
      AND scheduled_at::date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    ORDER BY scheduled_at ASC
  `;
  return rows;
}

async function getWeekLeads(): Promise<Lead[]> {
  const rows = await sql<Lead[]>`
    SELECT id, name, email, status
    FROM leads
    WHERE (created_at::date >= date_trunc('week', CURRENT_DATE)
           AND created_at::date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')
       OR (updated_at::date >= date_trunc('week', CURRENT_DATE)
           AND updated_at::date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')
    ORDER BY updated_at DESC
    LIMIT 50
  `;

  return rows;
}

export default async function OverviewWeekPage() {
  const [sessions, bookings, leads] = await Promise.all([
    getWeekSessions(),
    getWeekBookings(),
    getWeekLeads()
  ]);

  const allSlots = [
    ...sessions.map((s) => ({ type: "session" as const, ...s })),
    ...bookings.map((b) => ({ type: "booking" as const, id: b.id, title: "Úvodní call", scheduled_at: b.scheduled_at, client_name: b.name }))
  ].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  return (
    <div className="py-2">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Přehled týdne
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Schůzky a změny u leadů v aktuálním týdnu.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Schůzky a rezervace tento týden
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {allSlots.length}
            </span>
          </div>
          {allSlots.length === 0 ? (
            <p className="text-xs text-slate-500">
              V tomto týdnu zatím nejsou naplánované žádné schůzky ani rezervace.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {allSlots.map((s) => (
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
                      {new Date(s.scheduled_at).toLocaleString("cs-CZ", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Aktivita v CRM tento týden
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {leads.length}
            </span>
          </div>
          {leads.length === 0 ? (
            <p className="text-xs text-slate-500">
              Tento týden zatím žádná změna u leadů.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {lead.name || "Bez jména"}
                    </div>
                    <div className="text-xs text-slate-500">{lead.email}</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">
                      {lead.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

