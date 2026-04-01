// Returning member login: user provides email, we verify subscription via Stripe.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const COOKIE_NAME = "lab_email";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ valid: false }, { status: 500 });
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ valid: false, error: "Neplatný e-mail." });
    }

    const stripe = new Stripe(stripeSecretKey);
    const customers = await stripe.customers.list({ email, limit: 5 });

    for (const customer of customers.data) {
      for (const status of ["active", "trialing"] as const) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status,
          limit: 1,
        });
        if (subs.data.length > 0) {
          const response = NextResponse.json({ valid: true });
          response.cookies.set(COOKIE_NAME, email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE,
            path: "/",
          });
          return response;
        }
      }
    }

    return NextResponse.json({
      valid: false,
      error: "Pro tenhle e-mail nemáme aktivní předplatné. Zkontroluj adresu nebo se přihlas přes Stripe zákaznický portál.",
    });
  } catch (err) {
    console.error("[laborator login]", err);
    return NextResponse.json({ valid: false, error: "Chyba serveru." });
  }
}
