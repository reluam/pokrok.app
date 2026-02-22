import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { sendBookingReminderToClient } from "@/lib/booking-email";

/**
 * Cron pro odeslání připomínek 24 h před schůzkou.
 * Volá se z cron-job.org (např. každou hodinu).
 * Zabezpečení: Authorization: Bearer <CRON_SECRET> nebo ?secret=<CRON_SECRET>
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const okAuth =
    (secret && authHeader === `Bearer ${secret}`) ||
    (secret && querySecret === secret);
  if (!okAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const rows = await sql`
    SELECT b.id AS booking_id, l.email, l.name, bs.start_at, bs.duration_minutes
    FROM bookings b
    JOIN leads l ON l.id = b.lead_id
    JOIN booking_slots bs ON bs.id = b.slot_id
    WHERE bs.start_at >= ${from}
      AND bs.start_at <= ${to}
      AND b.reminder_sent_at IS NULL
  ` as {
    booking_id: string;
    email: string;
    name: string | null;
    start_at: Date;
    duration_minutes: number;
  }[];

  let sent = 0;
  for (const row of rows) {
    const result = await sendBookingReminderToClient({
      to: row.email,
      name: row.name || "klient",
      slotAt: new Date(row.start_at),
      durationMinutes: row.duration_minutes,
    });
    if (result.ok) {
      await sql`
        UPDATE bookings SET reminder_sent_at = NOW() WHERE id = ${row.booking_id}
      `;
      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    remindersSent: sent,
    checked: rows.length,
  });
}
