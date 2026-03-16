import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/database";
import { getUserByEmail, getUserPurchases } from "@/lib/user-auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ziju.life";
}

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error("[audit checkout] chybí STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe není nakonfigurované." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Neplatný e-mail." }, { status: 400 });
    }

    // Zjisti, zda uživatel už Audit zakoupil (určí cenu)
    let isReturning = false;
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        const purchases = await getUserPurchases(existingUser.id);
        isReturning = purchases.some((p) => p.product_slug === "audit-zivota");
      }
    } catch (e) {
      console.warn("[audit checkout] getUserByEmail failed:", e);
    }

    // Načti Price ID — env var má přednost (dev/test), pak admin_settings (prod)
    type Row = {
      audit_zivota_price_id: string | null;
      audit_zivota_discount_price_id: string | null;
    };

    const envPriceId = process.env.AUDIT_ZIVOTA_PRICE_ID?.trim() || null;
    const envDiscountPriceId = process.env.AUDIT_ZIVOTA_DISCOUNT_PRICE_ID?.trim() || null;

    let priceId: string | null = isReturning
      ? (envDiscountPriceId || envPriceId)
      : envPriceId;

    if (!priceId) {
      try {
        const rows = (await sql`
          SELECT audit_zivota_price_id, audit_zivota_discount_price_id
          FROM admin_settings
          LIMIT 1
        `) as Row[];

        if (rows[0]) {
          priceId = isReturning
            ? (rows[0].audit_zivota_discount_price_id?.trim() ||
                rows[0].audit_zivota_price_id?.trim() ||
                null)
            : (rows[0].audit_zivota_price_id?.trim() || null);
        }
      } catch (e) {
        console.warn("[audit checkout] admin_settings query failed:", e);
      }
    }

    if (!priceId) {
      console.error("[audit checkout] žádné price ID v admin_settings");
      return NextResponse.json(
        { error: "Produkt ještě nemá nastavenou cenu. Kontaktuj prosím matej@ziju.life." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${siteUrl}/audit-zivota?payment=pending`,
      cancel_url: `${siteUrl}/audit-zivota`,
      metadata: {
        productType: "audit-zivota",
        userEmail: email,
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
    console.error("[audit checkout] unhandled error:", err);
    return NextResponse.json(
      { error: "Nepodařilo se připravit platbu. Zkus to prosím znovu." },
      { status: 500 }
    );
  }
}
