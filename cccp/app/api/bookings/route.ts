import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getAvailableSlots, isSlotFree } from "../../../lib/bookings";

const DEFAULT_DURATION_MINUTES = 30;

export async function POST(request: Request) {
  let body: {
    scheduled_at?: string;
    email?: string;
    name?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const scheduledAt = body.scheduled_at;
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim() || null;

  if (!scheduledAt || !email || !name) {
    return NextResponse.json(
      { error: "scheduled_at, email, and name are required" },
      { status: 400 }
    );
  }

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Invalid scheduled_at" },
      { status: 400 }
    );
  }

  const durationMinutes = DEFAULT_DURATION_MINUTES;

  const free = await isSlotFree(scheduledAt, durationMinutes);
  if (!free) {
    return NextResponse.json(
      { error: "Slot is no longer available" },
      { status: 409 }
    );
  }

  const fromDate = date.toISOString().slice(0, 10);
  const slots = await getAvailableSlots(fromDate, fromDate);
  const slotMs = date.getTime();
  const slotMatch = slots.some((s) => {
    const sMs = new Date(s.slot_at).getTime();
    return sMs === slotMs || Math.abs(sMs - slotMs) < 60 * 1000;
  });
  if (!slotMatch) {
    return NextResponse.json(
      { error: "Slot is not offered" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  try {
    let leadId: string | null = null;
    const existingLead = await sql<{ id: string }[]>`
      SELECT id FROM leads WHERE LOWER(email) = ${email} LIMIT 1
    `;
    if (existingLead.length > 0) {
      leadId = existingLead[0].id;
      await sql`
        UPDATE leads SET status = 'uvodni_call', updated_at = NOW() WHERE id = ${leadId}
      `;
    } else {
      leadId = crypto.randomUUID();
      await sql`
        INSERT INTO leads (id, email, name, source, status, created_at, updated_at)
        VALUES (${leadId}, ${email}, ${name}, 'booking', 'uvodni_call', NOW(), NOW())
      `;
    }

    await sql`
      INSERT INTO bookings (id, scheduled_at, duration_minutes, email, name, phone, lead_id, status, created_at)
      VALUES (${id}, ${date.toISOString()}, ${durationMinutes}, ${email}, ${name}, ${phone}, ${leadId}, 'pending', NOW())
    `;

    return NextResponse.json({
      ok: true,
      booking_id: id,
      lead_id: leadId,
    });
  } catch (err) {
    console.error("POST /api/bookings", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
