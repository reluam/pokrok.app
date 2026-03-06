import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/database";
import { getSlotById, isSlotFree, createBooking } from "@/lib/booking-slots-db";
import { getBookingSettings } from "@/lib/booking-settings";
import {
  sendBookingConfirmationToClient,
  sendBookingConfirmationToAdmin,
} from "@/lib/booking-email";
import { getLeadById } from "@/lib/leads-db";
import { createBookingTask, updateTaskToBooking } from "@/lib/clickup";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!stripeSecretKey || !webhookSecret) {
    console.error("Stripe webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Stripe není nakonfigurované" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
    const obj = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
    const m = obj.metadata || {};

    const slotId = (m.slotId as string | undefined) ?? "";
    const startAt = (m.startAt as string | undefined) ?? "";
    const durationMinutes = Number(m.durationMinutes ?? 0);
    const email = (m.email as string | undefined)?.toLowerCase() ?? "";
    const name = (m.name as string | undefined) ?? "";
    const note =
      typeof m.note === "string" && m.note.trim() ? m.note.trim() : undefined;
    const source = (m.source as string | undefined) ?? "koucing";
    const meetingType =
      typeof m.meetingType === "string" && m.meetingType.trim()
        ? m.meetingType.trim()
        : null;
    const leadIdMeta =
      typeof m.leadId === "string" && m.leadId.trim()
        ? m.leadId.trim()
        : undefined;

    if (!slotId || !startAt || !durationMinutes || !email || !name) {
      console.error("Stripe webhook: missing booking metadata", m);
      return NextResponse.json({ received: true });
    }

    try {
      const isWeekly = slotId.startsWith("weekly_");
      let slot: { id: string; start_at: Date; duration_minutes: number };

      if (isWeekly) {
        const start = new Date(startAt);
        if (Number.isNaN(start.getTime())) {
          console.error("Stripe webhook: invalid startAt", startAt);
          return NextResponse.json({ received: true });
        }
        const newSlotId = `slot_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        await sql`
          INSERT INTO booking_slots (id, start_at, duration_minutes, title, created_at)
          VALUES (${newSlotId}, ${start}, ${durationMinutes}, null, NOW())
        `;
        slot = { id: newSlotId, start_at: start, duration_minutes: durationMinutes };
      } else {
        const row = await getSlotById(slotId);
        if (!row) {
          console.error("Stripe webhook: slot not found", slotId);
          return NextResponse.json({ received: true });
        }
        if (!(await isSlotFree(slotId))) {
          console.error("Stripe webhook: slot already booked", slotId);
          return NextResponse.json({ received: true });
        }
        slot = {
          id: row.id,
          start_at: new Date(row.start_at),
          duration_minutes: row.duration_minutes,
        };
      }

      let resolvedLeadId = leadIdMeta;
      if (!resolvedLeadId) {
        const leads = (await sql`
          SELECT id FROM leads
          WHERE email = ${email}
          ORDER BY created_at DESC
          LIMIT 1
        `) as { id: string }[];
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

      await createBooking(resolvedLeadId, slot.id, meetingType);

      // meeting type label for e-maily
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
          // ignore
        }
      }

      // e-maily
      const { clickupListId: listId, clickupFieldConfig } = await getBookingSettings();
      const lead = resolvedLeadId ? await getLeadById(resolvedLeadId) : null;

      const [clientEmailResult, adminEmailResult] = await Promise.all([
        sendBookingConfirmationToClient({
          to: email,
          name,
          slotAt: slot.start_at,
          durationMinutes: slot.duration_minutes,
          meetingTypeLabel,
        }),
        sendBookingConfirmationToAdmin({
          clientName: name,
          clientEmail: email,
          slotAt: slot.start_at,
          durationMinutes: slot.duration_minutes,
          note,
          source,
          meetingTypeLabel,
        }),
      ]);
      if (!clientEmailResult.ok) {
        console.warn("[stripe webhook] E-mail klientovi:", clientEmailResult.error);
      }
      if (!adminEmailResult.ok) {
        console.warn("[stripe webhook] E-mail admin:", adminEmailResult.error);
      }

      // ClickUp (stejná logika jako v rezervaci)
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
        if (!result.ok) {
          console.warn("[stripe webhook] ClickUp update úkolu:", result.error);
        }
      } else if (listId) {
        const result = await createBookingTask({
          listId,
          name,
          email,
          note,
          source,
          slotStartAt: slot.start_at,
          durationMinutes: slot.duration_minutes,
          fieldConfig: clickupFieldConfig,
        });
        if (!result.ok) {
          console.warn("[stripe webhook] ClickUp úkol se nevytvořil:", result.error);
        }
      }
    } catch (err) {
      console.error("Stripe webhook booking error:", err);
    }
  }

  return NextResponse.json({ received: true });
}

