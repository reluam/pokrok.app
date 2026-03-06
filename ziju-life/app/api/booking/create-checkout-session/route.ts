import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/database";
import { getSlotById, isSlotFree } from "@/lib/booking-slots-db";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ziju.life";
}

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe není nakonfigurované (chybí STRIPE_SECRET_KEY)." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await request.json();
    const slotId = typeof body.slotId === "string" ? body.slotId.trim() : "";
    const startAt = typeof body.startAt === "string" ? body.startAt.trim() : "";
    const durationMinutes =
      typeof body.durationMinutes === "number" ? body.durationMinutes : undefined;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const note =
      typeof body.note === "string" ? body.note.trim() || undefined : undefined;
    const source = typeof body.source === "string" ? body.source : "koucing";
    const leadId =
      typeof body.leadId === "string" ? body.leadId.trim() || undefined : undefined;
    const meetingType =
      typeof body.meetingType === "string" && body.meetingType.trim()
        ? body.meetingType.trim()
        : null;

    if (!slotId || !startAt || !durationMinutes || !email || !name) {
      return NextResponse.json(
        { error: "Chybí údaje pro vytvoření platby (termín, jméno, e-mail)." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Neplatný e-mail." }, { status: 400 });
    }

    if (!meetingType) {
      return NextResponse.json(
        { error: "Placené schůzky musí mít vybraný typ." },
        { status: 400 }
      );
    }

    // Najdi typ schůzky a jeho priceId
    const rows = (await sql`
      SELECT booking_meeting_types
      FROM admin_settings
      LIMIT 1
    `) as { booking_meeting_types: string | null }[];
    const raw = rows[0]?.booking_meeting_types;
    let priceId: string | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const mt = parsed.find(
            (item: any) => item && item.id === meetingType && item.isPaid
          );
          if (mt && typeof mt.priceId === "string" && mt.priceId.trim()) {
            priceId = mt.priceId.trim();
          }
        }
      } catch {
        // ignore
      }
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Typ schůzky nemá nastavené Stripe Price ID nebo není placený." },
        { status: 400 }
      );
    }

    // Rychlá kontrola dostupnosti slotu (u jednorázových slotů)
    const isWeekly = slotId.startsWith("weekly_");
    if (!isWeekly) {
      const row = await getSlotById(slotId);
      if (!row) {
        return NextResponse.json(
          { error: "Termín už neexistuje. Zkus prosím jiný." },
          { status: 404 }
        );
      }
      if (!(await isSlotFree(slotId))) {
        return NextResponse.json(
          { error: "Termín je už obsazený. Vyber prosím jiný." },
          { status: 409 }
        );
      }
    }

    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${siteUrl}/koucing?booking=success`,
      cancel_url: `${siteUrl}/koucing?booking=cancelled`,
      metadata: {
        slotId,
        startAt,
        durationMinutes: String(durationMinutes),
        email,
        name,
        note: note ?? "",
        source,
        leadId: leadId ?? "",
        meetingType: meetingType ?? "",
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Nepodařilo se vytvořit platební sezení." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/booking/create-checkout-session error:", err);
    return NextResponse.json(
      { error: "Nepodařilo se připravit platbu přes Stripe." },
      { status: 500 }
    );
  }
}

