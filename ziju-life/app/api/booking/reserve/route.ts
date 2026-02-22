import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { getSlotById, isSlotFree, createBooking } from "@/lib/booking-slots-db";
import { createBookingTask, updateTaskToBooking } from "@/lib/clickup";
import { getBookingSettings } from "@/lib/booking-settings";
import { sendBookingConfirmationToClient, sendBookingConfirmationToAdmin } from "@/lib/booking-email";
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

    await createBooking(resolvedLeadId, slot.id);

    // Potvrzovací e-maily: klient + admin (matej@ziju.life)
    const [clientEmailResult, adminEmailResult] = await Promise.all([
      sendBookingConfirmationToClient({
        to: email,
        name,
        slotAt: slot.start_at,
        durationMinutes: slot.duration_minutes,
      }),
      sendBookingConfirmationToAdmin({
        clientName: name,
        clientEmail: email,
        slotAt: slot.start_at,
        durationMinutes: slot.duration_minutes,
        note,
        source,
      }),
    ]);
    if (!clientEmailResult.ok) console.warn("[reserve] E-mail klientovi:", clientEmailResult.error);
    if (!adminEmailResult.ok) console.warn("[reserve] E-mail admin:", adminEmailResult.error);

    const { clickupListId: listId, clickupFieldConfig } = await getBookingSettings();
    const lead = resolvedLeadId ? await getLeadById(resolvedLeadId) : null;
    if (lead?.clickupTaskId) {
      const result = await updateTaskToBooking({
        taskId: lead.clickupTaskId,
        name,
        email,
        source,
        note,
        slotStartAt: slot.start_at,
        durationMinutes: slot.duration_minutes,
        fieldConfig: clickupFieldConfig,
      });
      if (!result.ok) console.warn("[reserve] ClickUp update úkolu:", result.error);
    } else {
      const result = await createBookingTask({
        listId: listId ?? "",
        name,
        email,
        note,
        source,
        slotStartAt: slot.start_at,
        durationMinutes: slot.duration_minutes,
        fieldConfig: clickupFieldConfig,
      });
      if (!result.ok) console.warn("[reserve] ClickUp úkol se nevytvořil:", result.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/booking/reserve error:", err);
    return NextResponse.json(
      { error: "Rezervaci se nepodařilo dokončit." },
      { status: 500 }
    );
  }
}
