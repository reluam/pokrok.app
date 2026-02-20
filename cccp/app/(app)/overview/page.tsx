import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "../../../lib/db";
import { OverviewSlotsList } from "../../../components/calendar/OverviewSlotsList";

type TodaySession = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  client_name: string;
};

type TodayBooking = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  name: string;
  email: string;
};

type TodayLead = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  source: string | null;
};

async function getTodaySessions(userId: string): Promise<TodaySession[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.title,
      s.scheduled_at,
      s.duration_minutes,
      c.name AS client_name
    FROM sessions s
    JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
    WHERE s.scheduled_at::date = CURRENT_DATE
    ORDER BY s.scheduled_at ASC
  `;

  return rows as TodaySession[];
}

async function getTodayBookings(userId: string): Promise<TodayBooking[]> {
  const rows = await sql`
    SELECT id, scheduled_at, duration_minutes, name, email
    FROM bookings
    WHERE user_id = ${userId}
      AND status != 'cancelled'
      AND scheduled_at::date = CURRENT_DATE
    ORDER BY scheduled_at ASC
  `;
  return rows as TodayBooking[];
}

async function getTodayLeadsActivities(): Promise<TodayLead[]> {
  const rows = await sql`
    SELECT id, name, email, status, source
    FROM leads
    WHERE created_at::date = CURRENT_DATE
      OR updated_at::date = CURRENT_DATE
    ORDER BY updated_at DESC
    LIMIT 20
  `;

  return rows as TodayLead[];
}

export default async function OverviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const [sessions, bookings, leads] = await Promise.all([
    getTodaySessions(userId),
    getTodayBookings(userId),
    getTodayLeadsActivities()
  ]);

  const allSlots = [
    ...sessions.map((s) => ({ type: "session" as const, ...s })),
    ...bookings.map((b) => ({ type: "booking" as const, id: b.id, title: "Úvodní call", scheduled_at: b.scheduled_at, duration_minutes: b.duration_minutes, client_name: b.name }))
  ].sort((a, b) => String(a.scheduled_at ?? "").localeCompare(String(b.scheduled_at ?? "")));

  return (
    <div className="py-2">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Přehled dneška
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Rychlý pohled na dnešní schůzky a aktivitu v CRM.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Dnešní schůzky a rezervace
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {allSlots.length}
            </span>
          </div>
          {allSlots.length === 0 ? (
            <p className="text-xs text-slate-500">
              Na dnešek nemáš v kalendáři žádné schůzky ani rezervace.
            </p>
          ) : (
            <OverviewSlotsList slots={allSlots} />
          )}
        </section>

        <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-900">
              Dnešní aktivita v CRM
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {leads.length}
            </span>
          </div>
          {leads.length === 0 ? (
            <p className="text-xs text-slate-500">
              Dnes zatím žádná změna u leadů. Jakmile někoho přidáš nebo posuneš
              mezi stavy, uvidíš ho tady.
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
                    {lead.source ? (
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                        {lead.source}
                      </div>
                    ) : null}
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

