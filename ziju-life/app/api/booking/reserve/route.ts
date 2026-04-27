import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import {
  getSlotById,
  isSlotFree,
  createBooking,
  setBookingGoogleEvent,
} from "@/lib/booking-slots-db";
import { sendBookingConfirmationToClient, sendBookingConfirmationToAdmin } from "@/lib/booking-email";
import { getBookingSettings } from "@/lib/booking-settings";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getLeadById } from "@/lib/leads-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slotId = typeof body.slotId === "string" ? body.slotId.trim() : "";
    const startAt = typeof body.startAt === "string" ? body.startAt.trim() : "";
    const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() || undefined : undefined;
    const source = typeof body.source === "string" ? body.source : "koucing";
    const meetingType =
      typeof body.meetingType === "string" && body.meetingType.trim()
        ? body.meetingType.trim()
        : null;
    const leadId = typeof body.leadId === "string" ? body.leadId.trim() || undefined : undefined;

    if (!slotId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
      return NextResponse.json(
        { error: "Vyplňte jméno, e-mail a vyberte termín." },
        { status: 400 }
      );
    }

    const isWeekly = slotId.startsWith("weekly_");
    let slot: { id: string; start_at: Date; duration_minutes: number };

    if (isWeekly) {
      if (!startAt || !durationMinutes) {
        return NextResponse.json({ error: "Neplatný termín (weekly)." }, { status: 400 });
      }
      const start = new Date(startAt);
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json({ error: "Neplatné datum termínu." }, { status: 400 });
      }
      const newSlotId = `slot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await sql`
        INSERT INTO booking_slots (id, start_at, duration_minutes, title, created_at)
        VALUES (${newSlotId}, ${start}, ${durationMinutes}, null, NOW())
      `;
      slot = { id: newSlotId, start_at: start, duration_minutes: durationMinutes };
    } else {
      const row = await getSlotById(slotId);
      if (!row) {
        return NextResponse.json({ error: "Termín neexistuje." }, { status: 404 });
      }
      if (!(await isSlotFree(slotId))) {
        return NextResponse.json({ error: "Termín je již obsazen." }, { status: 409 });
      }
      slot = { id: row.id, start_at: new Date(row.start_at), duration_minutes: row.duration_minutes };
    }

    let resolvedLeadId = leadId;
    if (!resolvedLeadId) {
      const leads = await sql`
        SELECT id FROM leads
        WHERE email = ${email}
        ORDER BY created_at DESC
        LIMIT 1
      ` as { id: string }[];
      resolvedLeadId = leads[0]?.id ?? null;
    }
    if (!resolvedLeadId) {
      const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date();
      await sql`
        INSERT INTO leads (id, email, name, source, status, message, created_at, updated_at)
        VALUES (${id}, ${email}, ${name}, ${source}, 'novy', ${note ?? null}, ${now}, ${now})
      `;
      resolvedLeadId = id;
    }

    const bookingId = await createBooking(resolvedLeadId, slot.id, meetingType);

    // Resolve meeting type label for e-maily
    let meetingTypeLabel: string | null = null;
    if (meetingType) {
      try {
        const rows = (await sql`
          SELECT booking_meeting_types
          FROM admin_settings
          LIMIT 1
        `) as { booking_meeting_types: string | null }[];
        const raw = rows[0]?.booking_meeting_types;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const mt = parsed.find(
              (item: any) => item && typeof item.id === "string" && item.id === meetingType
            );
            if (mt && typeof mt.label === "string" && mt.label.trim()) {
              meetingTypeLabel = mt.label.trim();
            }
          }
        }
      } catch {
        // ignore, fall back to null
      }
    }

    // Zjisti, zda je typ schůzky placený + případná cena a Stripe link
    let isPaidMeeting = false;
    let meetingPriceCzk: number | null = null;
    let meetingStripePaymentLinkUrl: string | null = null;
    if (meetingType) {
      try {
        const rows = (await sql`
          SELECT booking_meeting_types
          FROM admin_settings
          LIMIT 1
        `) as { booking_meeting_types: string | null }[];
        const raw = rows[0]?.booking_meeting_types;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const mt = parsed.find(
              (item: any) => item && typeof item.id === "string" && item.id === meetingType
            );
            if (mt && mt.isPaid) {
              isPaidMeeting = true;
            }
            const priceNum = Number((mt as any)?.priceCzk);
            if (!Number.isNaN(priceNum) && priceNum > 0) {
              meetingPriceCzk = Math.round(priceNum);
            }
            const stripeLinkRaw = (mt as any)?.stripePaymentLinkUrl;
            if (typeof stripeLinkRaw === "string" && stripeLinkRaw.trim()) {
              meetingStripePaymentLinkUrl = stripeLinkRaw.trim();
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Nastav due date pro platbu (48 h před termínem) – jen pro placené schůzky
    if (isPaidMeeting && bookingId) {
      const dueAt = new Date(slot.start_at.getTime() - 48 * 60 * 60 * 1000);
      try {
        await sql`
          UPDATE bookings
          SET payment_status = 'unpaid',
              payment_due_at = ${dueAt}
          WHERE id = ${bookingId}
        `;
      } catch {
        // ignore
      }
    }

    // Vytvoř event v Google Kalendáři s Meet linkem (a pošli pozvánku klientovi).
    // Selhání blokuje ne — rezervace v DB i e-maily proběhnou nezávisle.
    let meetUrl: string | null = null;
    try {
      const { googleCalendarId, googleRefreshToken } = await getBookingSettings();
      const summary = `${meetingTypeLabel || "Konzultace"} – ${name}`;
      const descriptionLines = [
        `Klient: ${name} <${email}>`,
        meetingTypeLabel ? `Typ: ${meetingTypeLabel}` : null,
        source ? `Zdroj: ${source}` : null,
        note ? `\nPoznámka:\n${note}` : null,
      ].filter(Boolean) as string[];
      const event = await createCalendarEvent({
        calendarId: googleCalendarId,
        refreshToken: googleRefreshToken,
        start: slot.start_at,
        durationMinutes: slot.duration_minutes,
        summary,
        description: descriptionLines.join("\n"),
        attendees: [{ email, name }],
      });
      if (event) {
        meetUrl = event.meetUrl;
        try {
          await setBookingGoogleEvent(bookingId, event.eventId, event.meetUrl);
        } catch (e) {
          console.warn("[reserve] setBookingGoogleEvent:", e);
        }
      }
    } catch (e) {
      console.warn("[reserve] createCalendarEvent:", e);
    }

    // Potvrzovací e-maily: klient + admin (matej@ziju.life)
    const [clientEmailResult, adminEmailResult] = await Promise.all([
      sendBookingConfirmationToClient({
        to: email,
        name,
        slotAt: slot.start_at,
        durationMinutes: slot.duration_minutes,
        meetingTypeLabel,
        isPaidMeeting,
        amountCzk: meetingPriceCzk,
        stripePaymentLinkUrl: meetingStripePaymentLinkUrl,
        meetUrl,
      }),
      sendBookingConfirmationToAdmin({
        clientName: name,
        clientEmail: email,
        slotAt: slot.start_at,
        durationMinutes: slot.duration_minutes,
        note,
        source,
        meetingTypeLabel,
        meetUrl,
      }),
    ]);
    if (!clientEmailResult.ok) console.warn("[reserve] E-mail klientovi:", clientEmailResult.error);
    if (!adminEmailResult.ok) console.warn("[reserve] E-mail admin:", adminEmailResult.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/booking/reserve error:", err);
    return NextResponse.json(
      { error: "Rezervaci se nepodařilo dokončit." },
      { status: 500 }
    );
  }
}
