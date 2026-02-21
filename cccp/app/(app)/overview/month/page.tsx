import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "../../../../lib/db";
import { OverviewSlotsList } from "../../../../components/calendar/OverviewSlotsList";

type Session = {
  id: string;
  title: string;
  scheduled_at: string;
  client_name: string;
  project_id: string | null;
};

type Booking = {
  id: string;
  scheduled_at: string;
  name: string;
  project_id: string | null;
};

type Lead = {
  id: string;
  name: string | null;
  email: string;
  status: string;
};

async function getMonthSessions(userId: string, projectIds: string[]): Promise<Session[]> {
  try {
    if (projectIds.length > 0) {
      const rows = await sql`
        SELECT
          s.id,
          s.title,
          s.scheduled_at,
          COALESCE(c.name, 'Bez klienta') AS client_name,
          c.project_id
        FROM sessions s
        LEFT JOIN clients c ON c.id = s.client_id
        WHERE (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
          AND s.scheduled_at::date >= date_trunc('month', CURRENT_DATE)
          AND s.scheduled_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
          AND (c.project_id = ANY(${projectIds}) OR c.id IS NULL)
        ORDER BY s.scheduled_at ASC
      `;
      return rows as Session[];
    }
    const rows = await sql`
      SELECT
        s.id,
        s.title,
        s.scheduled_at,
        COALESCE(c.name, 'Bez klienta') AS client_name,
        c.project_id
      FROM sessions s
      LEFT JOIN clients c ON c.id = s.client_id
      WHERE (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
        AND s.scheduled_at::date >= date_trunc('month', CURRENT_DATE)
        AND s.scheduled_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
      ORDER BY s.scheduled_at ASC
    `;
    return rows as Session[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      const rows = await sql`
        SELECT
          s.id,
          s.title,
          s.scheduled_at,
          COALESCE(c.name, 'Bez klienta') AS client_name
        FROM sessions s
        INNER JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
        WHERE s.scheduled_at::date >= date_trunc('month', CURRENT_DATE)
          AND s.scheduled_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
        ORDER BY s.scheduled_at ASC
      `;
      return rows as Session[];
    }
    throw err;
  }
}

async function getMonthBookings(userId: string, projectIds: string[]): Promise<Booking[]> {
  if (projectIds.length > 0) {
    const rows = await sql`
      SELECT b.id, b.scheduled_at, b.name, e.project_id
      FROM bookings b
      LEFT JOIN events e ON e.id = b.event_id
      WHERE b.user_id = ${userId}
        AND b.status != 'cancelled'
        AND b.scheduled_at::date >= date_trunc('month', CURRENT_DATE)
        AND b.scheduled_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
        AND (e.project_id = ANY(${projectIds}) OR b.event_id IS NULL)
      ORDER BY b.scheduled_at ASC
    `;
    return rows as Booking[];
  }
  const rows = await sql`
    SELECT b.id, b.scheduled_at, b.name, e.project_id
    FROM bookings b
    LEFT JOIN events e ON e.id = b.event_id
    WHERE b.user_id = ${userId}
      AND b.status != 'cancelled'
      AND b.scheduled_at::date >= date_trunc('month', CURRENT_DATE)
      AND b.scheduled_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
    ORDER BY b.scheduled_at ASC
  `;
  return rows as Booking[];
}

async function getMonthLeads(userId: string, projectIds: string[]): Promise<Lead[]> {
  if (projectIds.length > 0) {
    const rows = await sql`
      SELECT id, name, email, status
      FROM leads
      WHERE (user_id = ${userId} OR user_id IS NULL)
        AND project_id = ANY(${projectIds})
        AND ((created_at::date >= date_trunc('month', CURRENT_DATE)
              AND created_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'))
             OR (updated_at::date >= date_trunc('month', CURRENT_DATE)
                 AND updated_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')))
      ORDER BY updated_at DESC
      LIMIT 100
    `;
    return rows as Lead[];
  }
  const rows = await sql`
    SELECT id, name, email, status
    FROM leads
    WHERE (created_at::date >= date_trunc('month', CURRENT_DATE)
           AND created_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'))
       OR (updated_at::date >= date_trunc('month', CURRENT_DATE)
           AND updated_at::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'))
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows as Lead[];
}

type PageProps = { searchParams?: Promise<{ projects?: string }> };

export default async function OverviewMonthPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const params = (await searchParams?.catch(() => ({})) ?? {}) as { projects?: string };
  const projectIds = params.projects ? params.projects.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const [sessions, bookings, leads] = await Promise.all([
    getMonthSessions(userId, projectIds),
    getMonthBookings(userId, projectIds),
    getMonthLeads(userId, projectIds)
  ]);

  const allSlots = [
    ...sessions.map((s) => ({ type: "session" as const, ...s })),
    ...bookings.map((b) => ({ type: "booking" as const, id: b.id, title: "Úvodní call", scheduled_at: b.scheduled_at, client_name: b.name, project_id: b.project_id ?? undefined }))
  ].sort((a, b) => String(a.scheduled_at ?? "").localeCompare(String(b.scheduled_at ?? "")));

  return (
    <div className="py-2">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Přehled měsíce
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Souhrn schůzek a pohybu v CRM za aktuální měsíc.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Schůzky a rezervace tento měsíc
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {allSlots.length}
            </span>
          </div>
          {allSlots.length === 0 ? (
            <p className="text-xs text-slate-500">
              V tomto měsíci zatím nejsou naplánované žádné schůzky ani rezervace.
            </p>
          ) : (
            <OverviewSlotsList slots={allSlots} />
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Aktivita v CRM tento měsíc
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {leads.length}
            </span>
          </div>
          {leads.length === 0 ? (
            <p className="text-xs text-slate-500">
              Tento měsíc zatím žádná změna u leadů.
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

