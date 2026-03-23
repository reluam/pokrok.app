import { cookies } from "next/headers";
import Stripe from "stripe";
import { verifyUserSession } from "@/lib/user-auth";

/**
 * Server-side check: verifies active Laboratoř Stripe subscription.
 *
 * Email is resolved in priority order:
 * 1. lab_email cookie (set after Stripe checkout flow)
 * 2. Existing DB user session (set after magic link login via /api/auth/magic-link)
 */
export async function checkLaboratorAccess(): Promise<boolean> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return false;

  // 1. Cookie set by Stripe checkout flow
  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get("lab_email")?.value?.trim();

  // 2. Existing DB user session (magic link login)
  let sessionEmail: string | undefined;
  try {
    const user = await verifyUserSession();
    sessionEmail = user?.email;
  } catch {
    // DB unavailable — ignore
  }

  const email = cookieEmail || sessionEmail;
  if (!email) return false;

  try {
    const stripe = new Stripe(stripeSecretKey);
    const customers = await stripe.customers.list({ email, limit: 5 });

    for (const customer of customers.data) {
      for (const status of ["active", "trialing"] as const) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status,
          limit: 1,
        });
        if (subs.data.length > 0) return true;
      }
    }
  } catch (err) {
    console.error("[laborator-auth]", err);
  }

  return false;
}
