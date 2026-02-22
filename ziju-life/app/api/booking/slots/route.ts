import { NextRequest, NextResponse } from "next/server";
import { getRawAvailableSlots, type BookingSlotRow } from "@/lib/booking-slots-db";
import { getBusyIntervals, slotOverlapsBusy } from "@/lib/google-calendar";
import { getBookingSettings } from "@/lib/booking-settings";
import { generateWeeklySlots } from "@/lib/weekly-availability-db";

const DEFAULT_DAYS_AHEAD = 14;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    let now: Date;
    let toDate: Date;
    const realNow = new Date();
    if (fromParam && toParam) {
      const from = new Date(fromParam + "T00:00:00");
      const to = new Date(toParam + "T23:59:59");
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        now = realNow;
        toDate = new Date(realNow);
        toDate.setDate(toDate.getDate() + DEFAULT_DAYS_AHEAD);
      } else {
        now = from < realNow ? realNow : from;
        toDate = to;
      }
    } else {
      now = realNow;
      toDate = new Date(realNow);
      toDate.setDate(toDate.getDate() + DEFAULT_DAYS_AHEAD);
    }

    const [raw, weekly] = await Promise.all([
      getRawAvailableSlots(now, toDate),
      generateWeeklySlots(now, toDate),
    ]);

    const { googleCalendarId, googleRefreshToken } = await getBookingSettings();
    const busy = await getBusyIntervals(googleCalendarId, now, toDate, { refreshToken: googleRefreshToken });

    const oneOffStarts = new Set<string>();
    const slots: { id: string; startAt: string; durationMinutes: number; title?: string | null }[] = [];

    for (const row of raw as BookingSlotRow[]) {
      const start = new Date(row.start_at);
      const end = new Date(start.getTime() + row.duration_minutes * 60 * 1000);
      if (busy.length > 0 && slotOverlapsBusy(start, end, busy)) continue;
      const key = start.toISOString();
      oneOffStarts.add(key);
      slots.push({
        id: row.id,
        startAt: key,
        durationMinutes: row.duration_minutes,
        title: row.title ?? undefined,
      });
    }

    for (const s of weekly) {
      if (oneOffStarts.has(s.startAt)) continue;
      const start = new Date(s.startAt);
      const end = new Date(start.getTime() + s.durationMinutes * 60 * 1000);
      if (busy.length > 0 && slotOverlapsBusy(start, end, busy)) continue;
      slots.push({
        id: s.id,
        startAt: s.startAt,
        durationMinutes: s.durationMinutes,
        title: s.title ?? undefined,
      });
    }

    slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("GET /api/booking/slots error:", err);
    return NextResponse.json(
      { error: "Nepodařilo se načíst termíny." },
      { status: 500 }
    );
  }
}
