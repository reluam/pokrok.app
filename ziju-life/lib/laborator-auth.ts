import { cookies } from "next/headers";
import Stripe from "stripe";
import { verifyUserSession } from "@/lib/user-auth";
import { sql } from "@/lib/database";

/**
 * Server-side check: verifies active Laboratoř access.
 *
 * Email is resolved in priority order:
 * 1. lab_email cookie (set after Stripe checkout flow)
 * 2. Existing DB user session (set after magic link login via /api/auth/magic-link)
 *
 * Access granted if:
 * A) Admin-granted free access exists in laborator_grants (checked first, cheaper)
 * B) Active/trialing Stripe subscription
 */
export async function checkLaboratorAccess(): Promise<boolean> {
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

  // A) Check admin-granted free access first (no Stripe round-trip needed)
  try {
    const rows = await sql`
      SELECT id FROM laborator_grants
      WHERE email = ${email.toLowerCase()}
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;
    if (rows.length > 0) return true;
  } catch {
    // DB unavailable — fall through to Stripe check
  }

  // B) Check Stripe subscription
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return false;

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
