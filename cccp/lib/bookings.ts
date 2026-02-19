import { sql } from "./db";
import { fetchGoogleCalendarEventsForUser } from "./google-calendar";

const COACH_TIMEZONE = "Europe/Prague";

type WeeklyAvailabilityRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Get day of week (0-6) for a date string YYYY-MM-DD in coach timezone.
 */
function getDayOfWeekInTimezone(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00Z");
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: COACH_TIMEZONE,
    weekday: "short",
  }).format(d);
  const i = WEEKDAY_NAMES.indexOf(wd);
  return i >= 0 ? i : 0;
}

/**
 * Get Prague offset in hours (1 or 2) for a given date for DST.
 */
function getPragueOffsetHours(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00Z");
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: COACH_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(d),
    10
  );
  return hour - 12;
}

/**
 * Create a Date (UTC) for a local time on a given date in coach timezone.
 * dateStr YYYY-MM-DD, timeStr HH:mm or HH:mm:ss.
 */
function localToUtc(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const offset = getPragueOffsetHours(dateStr);
  return new Date(Date.UTC(y!, mo! - 1, d!, (h ?? 0) - offset, min ?? 0, 0));
}

/**
 * Parse "HH:mm" or "HH:mm:ss" to minutes since midnight
 */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Generate candidate slot timestamps for a date in coach timezone.
 * dateStr is YYYY-MM-DD.
 */
function slotsForDate(
  dateStr: string,
  windows: WeeklyAvailabilityRow[]
): { slot_at: Date; duration_minutes: number }[] {
  const result: { slot_at: Date; duration_minutes: number }[] = [];
  const dayOfWeek = getDayOfWeekInTimezone(dateStr);

  for (const w of windows) {
    if (w.day_of_week !== dayOfWeek) continue;
    const startMin = timeToMinutes(w.start_time);
    const endMin = timeToMinutes(w.end_time);
    const duration = w.slot_duration_minutes;
    for (let m = startMin; m + duration <= endMin; m += duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const slotAt = localToUtc(dateStr, timeStr);
      result.push({ slot_at: slotAt, duration_minutes: duration });
    }
  }
  return result;
}

/**
 * Iterate calendar days from fromDate to toDate (inclusive). Dates as YYYY-MM-DD.
 */
function* dateRange(fromDate: string, toDate: string): Generator<string> {
  const from = new Date(fromDate + "T00:00:00Z");
  const to = new Date(toDate + "T23:59:59Z");
  const day = new Date(from);
  while (day <= to) {
    yield day.toISOString().slice(0, 10);
    day.setUTCDate(day.getUTCDate() + 1);
  }
}

/**
 * Check if two time ranges overlap (all in ms).
 */
function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type Slot = { slot_at: string; duration_minutes: number };

/**
 * Get available slots between from and to (ISO date strings YYYY-MM-DD) for a coach.
 * Excludes times already taken by that coach's bookings, sessions (clients owned by coach), and Google events.
 */
export async function getAvailableSlots(
  fromDate: string,
  toDate: string,
  userId: string
): Promise<Slot[]> {
  const windows = (await sql`
    SELECT id, day_of_week, start_time::text, end_time::text, slot_duration_minutes
    FROM weekly_availability
    WHERE user_id = ${userId}
    ORDER BY day_of_week, start_time
  `) as WeeklyAvailabilityRow[];

  if (windows.length === 0) {
    return [];
  }

  const from = new Date(fromDate + "T00:00:00Z");
  const to = new Date(toDate + "T23:59:59Z");

  const [bookingsRows, sessionsRows] = await Promise.all([
    sql`
      SELECT scheduled_at, duration_minutes
      FROM bookings
      WHERE user_id = ${userId}
        AND status != 'cancelled'
        AND scheduled_at >= ${from.toISOString()}
        AND scheduled_at <= ${to.toISOString()}
    `,
    sql`
      SELECT s.scheduled_at, s.duration_minutes
      FROM sessions s
      JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.scheduled_at IS NOT NULL
        AND s.scheduled_at >= ${from.toISOString()}
        AND s.scheduled_at <= ${to.toISOString()}
    `,
  ]);

  const bookingsList = bookingsRows as { scheduled_at: string; duration_minutes: number }[];
  const sessionsList = sessionsRows as { scheduled_at: string; duration_minutes: number | null }[];

  const blockedRanges: { start: number; end: number }[] = [];
  for (const b of bookingsList) {
    const start = new Date(b.scheduled_at).getTime();
    const dur = (b.duration_minutes ?? 30) * 60 * 1000;
    blockedRanges.push({ start, end: start + dur });
  }
  for (const s of sessionsList) {
    const start = new Date(s.scheduled_at).getTime();
    const dur = (s.duration_minutes ?? 30) * 60 * 1000;
    blockedRanges.push({ start, end: start + dur });
  }

  const googleEvents = await fetchGoogleCalendarEventsForUser(userId, from, to);
  for (const ev of googleEvents) {
    const start = new Date(ev.start).getTime();
    const end = new Date(ev.end).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      blockedRanges.push({ start, end });
    }
  }

  const candidates: { slot_at: Date; duration_minutes: number }[] = [];
  for (const d of dateRange(fromDate, toDate)) {
    candidates.push(...slotsForDate(d, windows));
  }

  const out: Slot[] = [];
  for (const c of candidates) {
    const start = c.slot_at.getTime();
    const end = start + c.duration_minutes * 60 * 1000;
    const isBlocked = blockedRanges.some((r) =>
      overlaps(start, end, r.start, r.end)
    );
    if (!isBlocked && c.slot_at >= from && c.slot_at <= to) {
      out.push({
        slot_at: c.slot_at.toISOString(),
        duration_minutes: c.duration_minutes,
      });
    }
  }

  out.sort((a, b) => a.slot_at.localeCompare(b.slot_at));
  return out;
}

/**
 * Check if a given slot is still free for the coach (no overlapping booking, session, or Google event).
 */
export async function isSlotFree(
  scheduledAt: string,
  durationMinutes: number,
  userId: string
): Promise<boolean> {
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMinutes * 60 * 1000;
  const startISO = new Date(start).toISOString();
  const endISO = new Date(end - 1).toISOString();

  const [bookingsRaw, sessionsRaw] = await Promise.all([
    sql`
      SELECT scheduled_at, duration_minutes
      FROM bookings
      WHERE user_id = ${userId}
        AND status != 'cancelled'
        AND scheduled_at < ${endISO}
        AND scheduled_at + (COALESCE(duration_minutes, 30) * interval '1 minute') > ${startISO}
    `,
    sql`
      SELECT s.scheduled_at, s.duration_minutes
      FROM sessions s
      JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.scheduled_at IS NOT NULL
        AND s.scheduled_at < ${endISO}
        AND s.scheduled_at + (COALESCE(s.duration_minutes, 30) * interval '1 minute') > ${startISO}
    `,
  ]);

  const bookings = bookingsRaw as { scheduled_at: string; duration_minutes: number }[];
  const sessions = sessionsRaw as { scheduled_at: string; duration_minutes: number | null }[];

  for (const b of bookings) {
    const bStart = new Date(b.scheduled_at).getTime();
    const bEnd = bStart + (b.duration_minutes ?? 30) * 60 * 1000;
    if (overlaps(start, end, bStart, bEnd)) return false;
  }
  for (const s of sessions) {
    const sStart = new Date(s.scheduled_at).getTime();
    const sEnd = sStart + (s.duration_minutes ?? 30) * 60 * 1000;
    if (overlaps(start, end, sStart, sEnd)) return false;
  }

  const windowStart = new Date(start - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(end + 24 * 60 * 60 * 1000);
  const googleEvents = await fetchGoogleCalendarEventsForUser(userId, windowStart, windowEnd);
  for (const ev of googleEvents) {
    const evStart = new Date(ev.start).getTime();
    const evEnd = new Date(ev.end).getTime();
    if (!Number.isNaN(evStart) && !Number.isNaN(evEnd) && overlaps(start, end, evStart, evEnd)) {
      return false;
    }
  }
  return true;
}

/**
 * Get available slots for an event (uses event_availability and event.duration_minutes).
 * Blocks by coach's bookings, sessions, and Google events.
 */
export async function getAvailableSlotsForEvent(
  eventId: string,
  fromDate: string,
  toDate: string
): Promise<Slot[]> {
  const eventRows = (await sql`
    SELECT e.id, e.user_id, e.duration_minutes,
           ea.day_of_week, ea.start_time::text AS start_time, ea.end_time::text AS end_time
    FROM events e
    LEFT JOIN event_availability ea ON ea.event_id = e.id
    WHERE e.id = ${eventId}
  `) as { id: string; user_id: string; duration_minutes: number; day_of_week: number; start_time: string; end_time: string }[];

  if (!eventRows.length) return [];
  const first = eventRows[0];
  const userId = first.user_id;
  const durationMinutes = first.duration_minutes;

  const windows: WeeklyAvailabilityRow[] = eventRows
    .filter((r) => r.day_of_week != null)
    .map((r) => ({
      id: `${r.day_of_week}-${r.start_time}-${r.end_time}`,
      day_of_week: r.day_of_week,
      start_time: r.start_time,
      end_time: r.end_time,
      slot_duration_minutes: durationMinutes,
    }));

  if (windows.length === 0) return [];

  const from = new Date(fromDate + "T00:00:00Z");
  const to = new Date(toDate + "T23:59:59Z");

  const [bookingsRows, sessionsRows] = await Promise.all([
    sql`
      SELECT scheduled_at, duration_minutes
      FROM bookings
      WHERE user_id = ${userId}
        AND status != 'cancelled'
        AND scheduled_at >= ${from.toISOString()}
        AND scheduled_at <= ${to.toISOString()}
    `,
    sql`
      SELECT s.scheduled_at, s.duration_minutes
      FROM sessions s
      JOIN clients c ON c.id = s.client_id AND c.user_id = ${userId}
      WHERE s.scheduled_at IS NOT NULL
        AND s.scheduled_at >= ${from.toISOString()}
        AND s.scheduled_at <= ${to.toISOString()}
    `,
  ]);

  const bookingsList = bookingsRows as { scheduled_at: string; duration_minutes: number }[];
  const sessionsList = sessionsRows as { scheduled_at: string; duration_minutes: number | null }[];

  const blockedRanges: { start: number; end: number }[] = [];
  for (const b of bookingsList) {
    const start = new Date(b.scheduled_at).getTime();
    const dur = (b.duration_minutes ?? 30) * 60 * 1000;
    blockedRanges.push({ start, end: start + dur });
  }
  for (const s of sessionsList) {
    const start = new Date(s.scheduled_at).getTime();
    const dur = (s.duration_minutes ?? 30) * 60 * 1000;
    blockedRanges.push({ start, end: start + dur });
  }

  const googleEvents = await fetchGoogleCalendarEventsForUser(userId, from, to);
  for (const ev of googleEvents) {
    const start = new Date(ev.start).getTime();
    const end = new Date(ev.end).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      blockedRanges.push({ start, end });
    }
  }

  const candidates: { slot_at: Date; duration_minutes: number }[] = [];
  for (const d of dateRange(fromDate, toDate)) {
    candidates.push(...slotsForDate(d, windows));
  }

  const out: Slot[] = [];
  for (const c of candidates) {
    const start = c.slot_at.getTime();
    const end = start + c.duration_minutes * 60 * 1000;
    const isBlocked = blockedRanges.some((r) =>
      overlaps(start, end, r.start, r.end)
    );
    if (!isBlocked && c.slot_at >= from && c.slot_at <= to) {
      out.push({
        slot_at: c.slot_at.toISOString(),
        duration_minutes: c.duration_minutes,
      });
    }
  }

  out.sort((a, b) => a.slot_at.localeCompare(b.slot_at));
  return out;
}
