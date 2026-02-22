import { sql } from "./database";

export interface WeeklyBlockRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

/** 0=Sunday, 1=Monday, ... 6=Saturday */
export async function getWeeklyAvailability(): Promise<WeeklyBlockRow[]> {
  const rows = await sql`
    SELECT id, day_of_week, start_time, end_time, slot_duration_minutes
    FROM weekly_availability
    ORDER BY day_of_week ASC, start_time ASC
  `;
  return rows as WeeklyBlockRow[];
}

export async function saveWeeklyAvailability(
  blocks: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number }[]
): Promise<void> {
  await sql`DELETE FROM weekly_availability`;
  for (const b of blocks) {
    const id = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await sql`
      INSERT INTO weekly_availability (id, day_of_week, start_time, end_time, slot_duration_minutes, created_at)
      VALUES (${id}, ${b.dayOfWeek}, ${b.startTime}, ${b.endTime}, ${b.slotDurationMinutes}, NOW())
    `;
  }
}

/** Parse "09:00" or "09:30" to minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Generate slot start times for one block on a given date (local date). */
function slotStartsForBlock(
  date: Date,
  startTime: string,
  endTime: string,
  slotDurationMinutes: number
): Date[] {
  const out: Date[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  for (let min = startMin; min + slotDurationMinutes <= endMin; min += slotDurationMinutes) {
    out.push(new Date(year, month, day, Math.floor(min / 60), min % 60, 0, 0));
  }
  return out;
}

/** Get booked slot intervals in range (start_at, end_at) for overlap check */
export async function getBookedSlotIntervals(
  fromDate: Date,
  toDate: Date
): Promise<{ start: Date; end: Date }[]> {
  const rows = await sql`
    SELECT bs.start_at, bs.duration_minutes
    FROM bookings b
    JOIN booking_slots bs ON bs.id = b.slot_id
    WHERE bs.start_at >= ${fromDate} AND bs.start_at < ${toDate}
  ` as { start_at: string; duration_minutes: number }[];
  return rows.map((r) => {
    const start = new Date(r.start_at);
    const end = new Date(start.getTime() + r.duration_minutes * 60 * 1000);
    return { start, end };
  });
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  booked: { start: Date; end: Date }[]
): boolean {
  for (const b of booked) {
    if (slotStart < b.end && slotEnd > b.start) return true;
  }
  return false;
}

export interface GeneratedSlot {
  id: string;
  startAt: string;
  durationMinutes: number;
  title?: string | null;
}

/** Generate available slots from weekly availability for date range. Excludes times that are already booked. */
export async function generateWeeklySlots(
  fromDate: Date,
  toDate: Date
): Promise<GeneratedSlot[]> {
  const blocks = await getWeeklyAvailability();
  if (blocks.length === 0) return [];

  const booked = await getBookedSlotIntervals(fromDate, toDate);
  const slots: GeneratedSlot[] = [];
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= toDate) {
    const dayOfWeek = cursor.getDay();
    const dayBlocks = blocks.filter((b) => b.day_of_week === dayOfWeek);
    for (const block of dayBlocks) {
      const starts = slotStartsForBlock(
        new Date(cursor),
        block.start_time,
        block.end_time,
        block.slot_duration_minutes
      );
      for (const start of starts) {
        if (start < fromDate) continue;
        const end = new Date(start.getTime() + block.slot_duration_minutes * 60 * 1000);
        if (end > toDate) continue;
        if (overlaps(start, end, booked)) continue;
        slots.push({
          id: `weekly_${start.toISOString()}`,
          startAt: start.toISOString(),
          durationMinutes: block.slot_duration_minutes,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
}
