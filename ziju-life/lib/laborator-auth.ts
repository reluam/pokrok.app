import { cookies } from "next/headers";
import Stripe from "stripe";

/**
 * Server-side check: reads lab_email cookie and verifies active Stripe subscription.
 * Use in Server Components and Route Handlers.
 */
export async function checkLaboratorAccess(): Promise<boolean> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return false;

  const cookieStore = await cookies();
  const email = cookieStore.get("lab_email")?.value?.trim();
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
