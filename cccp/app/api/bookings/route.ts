import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getAvailableSlots, getAvailableSlotsForEvent, isSlotFree } from "../../../lib/bookings";
import { sendBookingConfirmation, sendCoachNotification } from "../../../lib/email";
import { clerkClient } from "@clerk/nextjs/server";

const DEFAULT_DURATION_MINUTES = 30;

export async function POST(request: Request) {
  let body: {
    coach?: string;
    event_id?: string;
    source?: string;
    scheduled_at?: string;
    email?: string;
    name?: string;
    phone?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const coachUserId = (body.coach ?? "").trim();
  const eventId = (body.event_id ?? "").trim() || null;
  const sourceRaw = typeof body.source === "string" ? body.source.trim().slice(0, 50) : "";
  const source = /^[a-zA-Z0-9_-]+$/.test(sourceRaw) ? sourceRaw : "";
  const scheduledAt = body.scheduled_at;
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim() || null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null;

  let resolvedCoach = coachUserId;
  let durationMinutes = DEFAULT_DURATION_MINUTES;
  let bookingEventId: string | null = null;
  let eventName: string | undefined = undefined;

  if (eventId) {
    const eventRows = await sql`
      SELECT id, user_id, duration_minutes, name FROM events WHERE id = ${eventId} LIMIT 1
    ` as { id: string; user_id: string; duration_minutes: number; name: string }[];
    if (eventRows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    resolvedCoach = eventRows[0].user_id;
    durationMinutes = eventRows[0].duration_minutes;
    eventName = eventRows[0].name;
    bookingEventId = eventId;
  }

  if (!resolvedCoach) {
    return NextResponse.json(
      { error: "coach (user ID) or event_id is required" },
      { status: 400 }
    );
  }
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

  const free = await isSlotFree(scheduledAt, durationMinutes, resolvedCoach);
  if (!free) {
    return NextResponse.json(
      { error: "Slot is no longer available" },
      { status: 409 }
    );
  }

  const fromDate = date.toISOString().slice(0, 10);
  const slots = bookingEventId
    ? await getAvailableSlotsForEvent(bookingEventId, fromDate, fromDate)
    : await getAvailableSlots(fromDate, fromDate, resolvedCoach);
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
  const leadSource = source || "booking";

  try {
    let leadId: string | null = null;
    const existingLead = (await sql`
      SELECT id FROM leads WHERE LOWER(email) = ${email} LIMIT 1
    `) as { id: string }[];
    if (existingLead.length > 0) {
      leadId = existingLead[0].id;
      await sql`
        UPDATE leads SET status = 'uvodni_call', updated_at = NOW() WHERE id = ${leadId}
      `;
    } else {
      leadId = crypto.randomUUID();
      await sql`
        INSERT INTO leads (id, email, name, source, status, created_at, updated_at)
        VALUES (${leadId}, ${email}, ${name}, ${leadSource}, 'uvodni_call', NOW(), NOW())
      `;
    }

    await sql`
      INSERT INTO bookings (id, user_id, scheduled_at, duration_minutes, email, name, phone, note, lead_id, status, source, event_id, created_at)
      VALUES (${id}, ${resolvedCoach}, ${date.toISOString()}, ${durationMinutes}, ${email}, ${name}, ${phone}, ${note}, ${leadId}, 'pending', ${source || null}, ${bookingEventId}, NOW())
    `;

    // Send confirmation email to client (async, don't block response)
    sendBookingConfirmation({
      to: email,
      name,
      scheduledAt: scheduledAt,
      durationMinutes,
      eventName,
      note: note || undefined,
    }).catch((err) => {
      console.error("Failed to send booking confirmation email:", err);
    });

    // Send notification email to coach (async, don't block response)
    (async () => {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(resolvedCoach);
        const coachEmail = user.emailAddresses[0]?.emailAddress;
        if (coachEmail) {
          const result = await sendCoachNotification({
            coachEmail,
            clientName: name,
            clientEmail: email,
            scheduledAt: scheduledAt,
            durationMinutes,
            eventName,
            note: note || undefined,
          });
          if (!result.success) {
            console.error("Failed to send coach notification:", result.error);
          }
        } else {
          console.error("Coach email not found for user:", resolvedCoach);
        }
      } catch (err) {
        console.error("Failed to get coach user or send notification:", err);
      }
    })();

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
