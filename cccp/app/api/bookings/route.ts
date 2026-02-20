import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../lib/db";
import { getAvailableSlots, getAvailableSlotsForEvent, isSlotFree } from "../../../lib/bookings";
import { sendBookingConfirmation, sendCoachNotification } from "../../../lib/email";
import { clerkClient } from "@clerk/nextjs/server";

const DEFAULT_DURATION_MINUTES = 30;

export async function POST(request: Request) {
  const { userId: authenticatedUserId } = await auth();
  const isCoachAdding = !!authenticatedUserId;

  let body: {
    coach?: string;
    event_id?: string;
    source?: string;
    scheduled_at?: string;
    email?: string;
    name?: string;
    phone?: string;
    note?: string;
    duration_minutes?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const coachUserId = (body.coach ?? "").trim() || (isCoachAdding ? authenticatedUserId! : null);
  const eventId = (body.event_id ?? "").trim() || null;
  const sourceRaw = typeof body.source === "string" ? body.source.trim().slice(0, 50) : "";
  const source = /^[a-zA-Z0-9_-]+$/.test(sourceRaw) ? sourceRaw : "";
  const scheduledAt = body.scheduled_at;
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim() || null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null;
  const durationMinutesFromBody = body.duration_minutes ? Math.min(120, Math.max(15, Number(body.duration_minutes) || DEFAULT_DURATION_MINUTES)) : undefined;

  let resolvedCoach = coachUserId;
  let durationMinutes = durationMinutesFromBody ?? DEFAULT_DURATION_MINUTES;
  let bookingEventId: string | null = null;
  let eventName: string | undefined = undefined;

  let oneBookingPerEmail = false;
  if (eventId) {
    const eventRows = await sql`
      SELECT id, user_id, duration_minutes, name, COALESCE(one_booking_per_email, false) AS one_booking_per_email
      FROM events WHERE id = ${eventId} LIMIT 1
    ` as { id: string; user_id: string; duration_minutes: number; name: string; one_booking_per_email: boolean }[];
    if (eventRows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!isCoachAdding) {
      // Pro veřejné bookingy: event určuje kouče
      resolvedCoach = eventRows[0].user_id;
      durationMinutes = eventRows[0].duration_minutes;
    } else {
      // Pro kouče: event je jen referenční, použije duration z eventu jen pokud není v body
      if (durationMinutesFromBody === undefined) {
        durationMinutes = eventRows[0].duration_minutes;
      }
    }
    eventName = eventRows[0].name;
    oneBookingPerEmail = eventRows[0].one_booking_per_email ?? false;
    bookingEventId = eventId;
  }

  const durationMins =
    durationMinutes != null && Number.isFinite(Number(durationMinutes))
      ? Math.min(120, Math.max(15, Number(durationMinutes)))
      : DEFAULT_DURATION_MINUTES;

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

  const free = await isSlotFree(scheduledAt, durationMins, resolvedCoach);
  if (!free) {
    return NextResponse.json(
      { error: "Slot is no longer available" },
      { status: 409 }
    );
  }

  // Pro veřejné bookingy: kontrola, jestli slot je v nabídce
  // Pro kouče: žádná kontrola - může přidat jakýkoli termín
  if (!isCoachAdding) {
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
  }

  // Jedna rezervace na e-mail u tohoto eventu?
  if (bookingEventId && oneBookingPerEmail) {
    const existingSameEmail = await sql`
      SELECT id FROM bookings
      WHERE event_id = ${bookingEventId}
        AND LOWER(email) = ${email.trim().toLowerCase()}
        AND status != 'cancelled'
      LIMIT 1
    ` as { id: string }[];
    if (existingSameEmail.length > 0) {
      return NextResponse.json(
        { error: "S tímto e-mailem již máte u této nabídky rezervaci. Pro další termín použijte jiný e-mail nebo nás kontaktujte." },
        { status: 409 }
      );
    }
  }

  const id = crypto.randomUUID();
  const leadSourceVal = String(source || "booking");
  const leadNameVal = name.length > 0 ? name : null;

  let leadId: string | null = null;
  try {
    const existingLead = (await sql`
      SELECT id FROM leads WHERE LOWER(email) = ${email} AND (deleted_at IS NULL OR deleted_at > NOW()) LIMIT 1
    `) as { id: string }[];
    if (existingLead.length > 0) {
      leadId = existingLead[0].id;
      await sql`
        UPDATE leads SET status = 'uvodni_call', name = COALESCE(NULLIF(TRIM(${name}), ''), name), updated_at = NOW() WHERE id = ${leadId}
      `;
    } else {
      leadId = crypto.randomUUID();
      try {
        await sql`
          INSERT INTO leads (id, email, name, source, status, created_at, updated_at)
          VALUES (${leadId}, ${email}, ${leadNameVal}, ${leadSourceVal}, 'uvodni_call', NOW(), NOW())
        `;
      } catch (leadErr: unknown) {
        const msg = leadErr instanceof Error ? leadErr.message : String(leadErr);
        if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("already exists")) {
          const retry = (await sql`
            SELECT id FROM leads WHERE LOWER(email) = ${email} LIMIT 1
          `) as { id: string }[];
          if (retry.length > 0) {
            leadId = retry[0].id;
            await sql`
              UPDATE leads SET status = 'uvodni_call', name = COALESCE(NULLIF(TRIM(${name}), ''), name), updated_at = NOW() WHERE id = ${leadId}
            `;
          } else {
            leadId = null;
            console.warn("[Booking] Lead create failed (duplicate?), continuing without lead:", leadErr);
          }
        } else {
          leadId = null;
          console.warn("[Booking] Lead create failed, continuing without lead:", leadErr);
        }
      }
    }
  } catch (leadErr) {
    leadId = null;
    console.warn("[Booking] Lead create/update failed, continuing without lead:", leadErr);
  }

  const scheduledAtIso = date.toISOString();
  const sourceParam = source.length > 0 ? source : null;
  const eventIdParam = bookingEventId;
  const durationMinsNum = Number(durationMins);

  try {
    await sql`
      INSERT INTO bookings (id, user_id, scheduled_at, duration_minutes, email, name, phone, note, lead_id, status, source, event_id, created_at)
      VALUES (${id}, ${resolvedCoach}, ${scheduledAtIso}, ${durationMinsNum}, ${email}, ${name}, ${phone}, ${note}, ${leadId}, 'pending', ${sourceParam}, ${eventIdParam}, NOW())
    `;

    // Send confirmation email to client (async, don't block response)
    sendBookingConfirmation({
      to: email,
      name,
      scheduledAt: scheduledAt,
      durationMinutes: durationMins,
      eventName,
      note: note || undefined,
    })
      .then((result) => {
        if (result.success) {
          console.log(`[Booking] Confirmation email sent successfully to ${email}`);
        } else {
          console.error(`[Booking] Failed to send confirmation email to ${email}:`, result.error);
        }
      })
      .catch((err) => {
        console.error("[Booking] Exception sending confirmation email:", err);
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
            durationMinutes: durationMins,
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
