import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkDilnaAccess } from "@/lib/dilna-auth";
import { getDilnaUser } from "@/lib/dilna-user";

export const dynamic = "force-dynamic";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ziju.life";
}

export async function POST() {
  const valid = await checkDilnaAccess();
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getDilnaUser();
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.AI_CREDITS_PRICE_ID;

  if (!stripeSecretKey || !priceId) {
    console.error("[ai-credits checkout] Missing STRIPE_SECRET_KEY or AI_CREDITS_PRICE_ID");
    return NextResponse.json(
      { error: "Platební brána není nakonfigurovaná." },
      { status: 500 }
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${siteUrl}/dilna/dashboard?tab=nastrojarna&credits=purchased`,
      cancel_url: `${siteUrl}/dilna/dashboard?tab=nastrojarna`,
      metadata: {
        productType: "ai-credit-pack",
        userEmail: user.email,
        userId: user.id,
        credits: "50",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/dilna/ai-credits/checkout error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit platbu." },
      { status: 500 }
    );
  }
}
