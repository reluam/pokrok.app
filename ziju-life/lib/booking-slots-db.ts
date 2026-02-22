import { sql } from "./database";

export interface BookingSlotRow {
  id: string;
  start_at: Date;
  duration_minutes: number;
  title: string | null;
}

export interface AvailableSlot {
  id: string;
  startAt: string;
  durationMinutes: number;
  title?: string | null;
}

/** Fetch raw slots from DB: start_at >= now, not yet booked. Caller can filter by Google Calendar. */
export async function getRawAvailableSlots(
  fromDate: Date,
  toDate: Date
): Promise<BookingSlotRow[]> {
  const rows = await sql`
    SELECT bs.id, bs.start_at, bs.duration_minutes, bs.title
    FROM booking_slots bs
    LEFT JOIN bookings b ON b.slot_id = bs.id
    WHERE bs.start_at >= ${fromDate}
      AND bs.start_at <= ${toDate}
      AND b.id IS NULL
    ORDER BY bs.start_at ASC
  `;
  return rows as BookingSlotRow[];
}

export async function getSlotById(slotId: string): Promise<BookingSlotRow | null> {
  const rows = await sql`
    SELECT id, start_at, duration_minutes, title
    FROM booking_slots
    WHERE id = ${slotId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rows[0] as BookingSlotRow;
}

export async function isSlotFree(slotId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM bookings WHERE slot_id = ${slotId} LIMIT 1
  `;
  return rows.length === 0;
}

export async function createBooking(leadId: string, slotId: string): Promise<string> {
  const id = `booking_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await sql`
    INSERT INTO bookings (id, lead_id, slot_id, created_at)
    VALUES (${id}, ${leadId}, ${slotId}, NOW())
  `;
  return id;
}
