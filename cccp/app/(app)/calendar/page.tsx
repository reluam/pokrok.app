import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

async function getUpcomingSessions(userId: string): Promise<SessionRow[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.client_id,
      s.title,
      s.scheduled_at,
      s.duration_minutes,
      c.name AS client_name,
      c.email AS client_email
    FROM sessions s
    JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
    WHERE s.scheduled_at IS NOT NULL
    ORDER BY s.scheduled_at ASC
    LIMIT 50
  `;

  return rows as SessionRow[];
}

async function getUpcomingBookings(userId: string): Promise<BookingRow[]> {
  const rows = await sql`
    SELECT id, scheduled_at, duration_minutes, name, email
    FROM bookings
    WHERE user_id = ${userId} AND status != 'cancelled'
    ORDER BY scheduled_at ASC
    LIMIT 50
  `;
  return rows as BookingRow[];
}

export default async function CalendarPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const [sessions, bookings] = await Promise.all([
    getUpcomingSessions(userId),
    getUpcomingBookings(userId)
  ]);

  type Item = {
    type: "session" | "booking";
    id: string;
    title: string;
    scheduled_at: string | null;
    duration_minutes: number | null;
    client_name: string;
    client_email: string | null;
  };

  const allItems: Item[] = [
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
  ].sort((a, b) => String(a.scheduled_at ?? "").localeCompare(String(b.scheduled_at ?? "")));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

  function getDateKey(scheduledAt: string | null): string | null {
    if (!scheduledAt) return null;
    const d = new Date(scheduledAt);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getDayLabel(dateKey: string): string {
    const d = new Date(dateKey + "T12:00:00");
    const t = new Date(todayKey + "T12:00:00");
    const diffMs = d.getTime() - t.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Dnes";
    if (diffDays === 1) return "Zítra";
    if (diffDays >= 2 && diffDays <= 4) {
      const name = d.toLocaleDateString("cs-CZ", { weekday: "long" });
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Další";
  }

  const byDay = new Map<string, Item[]>();
  for (const item of allItems) {
    const key = getDateKey(item.scheduled_at) ?? "bez-data";
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(item);
  }

  const sortedDays = Array.from(byDay.keys()).sort();
  const daySections: { label: string; dateKey: string; items: Item[] }[] = [];
  let dalšiItems: Item[] = [];
  for (const dateKey of sortedDays) {
    if (dateKey === "bez-data") {
      dalšiItems = dalšiItems.concat(byDay.get(dateKey) ?? []);
      continue;
    }
    const label = getDayLabel(dateKey);
    const items = byDay.get(dateKey) ?? [];
    if (label === "Další") {
      dalšiItems = dalšiItems.concat(items);
    } else {
      daySections.push({ label, dateKey, items });
    }
  }
  if (dalšiItems.length > 0) {
    daySections.push({ label: "Další", dateKey: "", items: dalšiItems });
  }

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
          <div className="space-y-6 text-sm">
            {daySections.map(({ label, dateKey, items }, i) => (
              <div key={dateKey ? `${dateKey}-${label}` : `dalsi-${i}`}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </h2>
                <div className="space-y-2">
                  {items.map((s) => (
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

