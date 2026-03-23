import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json({ valid: false }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ valid: false });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false });
  } catch (err) {
    console.error("[system verify] error:", err);
    return NextResponse.json({ valid: false });
  }
}
