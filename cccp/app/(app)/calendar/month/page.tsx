import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "../../../../lib/db";
import { MonthGrid, type CalendarItem } from "../../../../components/calendar/MonthGrid";

async function getMonthItems(monthStart: string, monthEnd: string, userId: string): Promise<CalendarItem[]> {
  const [sessions, bookings] = await Promise.all([
    sql`
      SELECT s.id, s.title, s.scheduled_at, s.duration_minutes, c.name AS client_name, c.email AS client_email
      FROM sessions s
      JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.scheduled_at::date >= ${monthStart}
        AND s.scheduled_at::date < ${monthEnd}
      ORDER BY s.scheduled_at ASC
    `,
    sql`
      SELECT id, scheduled_at, duration_minutes, name, email
      FROM bookings
      WHERE user_id = ${userId}
        AND status != 'cancelled'
        AND scheduled_at::date >= ${monthStart}
        AND scheduled_at::date < ${monthEnd}
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

function formatMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
}

export default async function CalendarMonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const params = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0);
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;
  const monthEndNext = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const items = await getMonthItems(monthStart, monthEndNext, userId);

  const prevMonth = month === 1 ? [year - 1, 12] : [year, month - 1];
  const nextMonth = month === 12 ? [year + 1, 1] : [year, month + 1];

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Měsíční přehled
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Celý měsíc, pondělí až neděle. Schůzky a rezervace.
      </p>
      <section className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        <MonthGrid
          items={items}
          year={year}
          month={month}
          monthLabel={formatMonthLabel(year, month)}
          prevMonthHref={`/calendar/month?month=${prevMonth[0]}-${String(prevMonth[1]).padStart(2, "0")}`}
          nextMonthHref={`/calendar/month?month=${nextMonth[0]}-${String(nextMonth[1]).padStart(2, "0")}`}
        />
      </section>
    </div>
  );
}
