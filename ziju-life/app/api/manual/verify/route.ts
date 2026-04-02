// Called after Stripe redirects back with session_id.
// Verifies the subscription is active, then sets the lab_email cookie.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const COOKIE_NAME = "lab_email";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ valid: false }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId?.startsWith("cs_")) {
      return NextResponse.json({ valid: false });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const email =
      session.customer_details?.email || session.customer_email || null;
    const subscription = session.subscription as Stripe.Subscription | null;
    const subStatus = subscription?.status ?? null;

    if (!email || !["active", "trialing"].includes(subStatus ?? "")) {
      return NextResponse.json({ valid: false });
    }

    const response = NextResponse.json({ valid: true, email });
    response.cookies.set(COOKIE_NAME, email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[laborator verify]", err);
    return NextResponse.json({ valid: false });
  }
}
