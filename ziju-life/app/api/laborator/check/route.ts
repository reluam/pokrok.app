// Called by protected pages on every load.
// Reads lab_email cookie, verifies active Stripe subscription.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const COOKIE_NAME = "lab_email";

export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ valid: false }, { status: 500 });
    }

    const email = request.cookies.get(COOKIE_NAME)?.value?.trim();
    if (!email) {
      return NextResponse.json({ valid: false });
    }

    const stripe = new Stripe(stripeSecretKey);
    const customers = await stripe.customers.list({ email, limit: 5 });

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        return NextResponse.json({ valid: true, email });
      }
      // also accept trialing
      const trialing = await stripe.subscriptions.list({
        customer: customer.id,
        status: "trialing",
        limit: 1,
      });
      if (trialing.data.length > 0) {
        return NextResponse.json({ valid: true, email });
      }
    }

    return NextResponse.json({ valid: false });
  } catch (err) {
    console.error("[laborator check]", err);
    return NextResponse.json({ valid: false });
  }
}
