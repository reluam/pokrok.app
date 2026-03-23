import { NextResponse } from "next/server";
import Stripe from "stripe";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ziju.life";
}

export async function POST() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.SYSTEM_PRICE_ID;

    if (!stripeSecretKey) {
      console.error("[system checkout] chybí STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe není nakonfigurované." },
        { status: 500 }
      );
    }

    if (!priceId) {
      console.error("[system checkout] chybí SYSTEM_PRICE_ID");
      return NextResponse.json(
        { error: "Produkt ještě nemá nastavenou cenu." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/system/app?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/system`,
      metadata: {
        productType: "adhd-system",
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
    console.error("[system checkout] unhandled error:", err);
    return NextResponse.json(
      { error: "Nepodařilo se připravit platbu. Zkus to prosím znovu." },
      { status: 500 }
    );
  }
}
