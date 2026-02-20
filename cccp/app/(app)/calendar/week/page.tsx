import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "../../../../lib/db";
import { WeekGrid, type CalendarItem } from "../../../../components/calendar/WeekGrid";

function getMondayOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - (day === 0 ? 6 : day - 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function getWeekSessions(
  weekStart: string,
  weekEnd: string,
  userId: string
): Promise<CalendarItem[]> {
  try {
    return (await sql`
      SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, COALESCE(c.name, 'Bez klienta') AS client_name, c.email AS client_email
      FROM sessions s
      LEFT JOIN clients c ON c.id = s.client_id
      WHERE (s.user_id = ${userId} OR (s.user_id IS NULL AND c.user_id = ${userId}))
        AND s.scheduled_at IS NOT NULL
        AND s.scheduled_at::date >= ${weekStart}
        AND s.scheduled_at::date < ${weekEnd}
      ORDER BY s.scheduled_at ASC
    `) as CalendarItem[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("user_id") && msg.includes("does not exist")) {
      return (await sql`
        SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, COALESCE(c.name, 'Bez klienta') AS client_name, c.email AS client_email
        FROM sessions s
        INNER JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
        WHERE s.scheduled_at IS NOT NULL
          AND s.scheduled_at::date >= ${weekStart}
          AND s.scheduled_at::date < ${weekEnd}
        ORDER BY s.scheduled_at ASC
      `) as CalendarItem[];
    }
    throw err;
  }
}

async function getWeekItems(weekStart: string, weekEnd: string, userId: string): Promise<CalendarItem[]> {
  const [sessions, bookings] = await Promise.all([
    getWeekSessions(weekStart, weekEnd, userId),
    sql`
      SELECT id, scheduled_at, duration_minutes, name, email
      FROM bookings
      WHERE user_id = ${userId}
        AND status != 'cancelled'
        AND scheduled_at::date >= ${weekStart}
        AND scheduled_at::date < ${weekEnd}
      ORDER BY scheduled_at ASC
    `
  ]);

  const sessionItems = (sessions as CalendarItem[]).map((s) => ({ ...s, type: "session" as const }));
  const bookingItems = (bookings as { id: string; scheduled_at: string; duration_minutes: number; name: string; email: string }[]).map((b) => ({
    type: "booking" as const,
    id: b.id,
    title: "Úvodní call",
    scheduled_at: b.scheduled_at,
    duration_minutes: b.duration_minutes,
    client_name: b.name,
    client_email: b.email
  }));
  return [...sessionItems, ...bookingItems].sort((a, b) =>
    String(a.scheduled_at ?? "").localeCompare(String(b.scheduled_at ?? ""))
  );
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getDate()}. ${start.toLocaleDateString("cs-CZ", { month: "long" })} – ${end.getDate()}. ${end.toLocaleDateString("cs-CZ", { month: "long" })} ${end.getFullYear()}`;
}

export default async function CalendarWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const params = await searchParams;
  let monday: Date;
  if (params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)) {
    monday = new Date(params.week + "T12:00:00");
    if (Number.isNaN(monday.getTime())) monday = getMondayOfWeek(new Date());
    else monday = getMondayOfWeek(monday);
  } else {
    monday = getMondayOfWeek(new Date());
  }
  const weekStart = toYYYYMMDD(monday);
  const weekEndDate = new Date(monday);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEnd = toYYYYMMDD(weekEndDate);

  const items = await getWeekItems(weekStart, weekEnd, userId);

  const prevMonday = new Date(monday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Týdenní přehled
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Pondělí až neděle. Schůzky a rezervace v zvoleném týdnu.
      </p>
      <section className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        <WeekGrid
          items={items}
          weekStart={weekStart}
          weekLabel={formatWeekLabel(weekStart)}
          prevWeekHref={`/calendar/week?week=${toYYYYMMDD(prevMonday)}`}
          nextWeekHref={`/calendar/week?week=${toYYYYMMDD(nextMonday)}`}
        />
      </section>
    </div>
  );
}
