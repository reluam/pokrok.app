import { cookies } from "next/headers";
import Stripe from "stripe";
import { verifyUserSession } from "@/lib/user-auth";
import { sql } from "@/lib/database";

/**
 * In-memory cache for access checks.
 * Avoids repeated DB queries within the same serverless invocation (TTL: 60s).
 */
const accessCache = new Map<string, { result: boolean; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Server-side check: verifies active Laboratoř access.
 *
 * Checks the `laborator_access` table (populated by Stripe webhooks + admin grants).
 * Falls back to `laborator_grants` if `laborator_access` has no row.
 * No Stripe API calls on the hot path.
 */
export async function checkLaboratorAccess(emailOverride?: string): Promise<boolean> {
  let email = emailOverride;

  if (!email) {
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

    email = cookieEmail || sessionEmail;
  }

  if (!email) return false;

  const cacheKey = email.toLowerCase();

  // Check in-memory cache first
  const cached = accessCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.result;
  }

  // A) Check laborator_access table (populated by Stripe webhooks)
  try {
    const rows = await sql`
      SELECT has_access FROM laborator_access
      WHERE email = ${cacheKey} AND has_access = true
      LIMIT 1
    `;
    if (rows.length > 0) {
      accessCache.set(cacheKey, { result: true, ts: Date.now() });
      return true;
    }
  } catch {
    // Table may not exist yet — fall through
  }

  // B) Fallback: check admin-granted free access
  try {
    const rows = await sql`
      SELECT id FROM laborator_grants
      WHERE email = ${cacheKey}
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;
    if (rows.length > 0) {
      accessCache.set(cacheKey, { result: true, ts: Date.now() });
      return true;
    }
  } catch {
    // DB unavailable
  }

  // C) Final fallback: check Stripe API directly (slower but authoritative)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    try {
      const stripe = new Stripe(stripeSecretKey);
      const customers = await stripe.customers.list({ email: cacheKey, limit: 5 });
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
        if (subs.data.length > 0) {
          accessCache.set(cacheKey, { result: true, ts: Date.now() });
          // Backfill laborator_access for next time
          try {
            await sql`
              INSERT INTO laborator_access (email, has_access, stripe_customer_id, stripe_subscription_id, subscription_status, source, updated_at)
              VALUES (${cacheKey}, true, ${customer.id}, ${subs.data[0].id}, 'active', 'backfill', NOW())
              ON CONFLICT (email) DO UPDATE SET has_access = true, stripe_customer_id = ${customer.id}, stripe_subscription_id = ${subs.data[0].id}, subscription_status = 'active', updated_at = NOW()
            `;
          } catch {}
          return true;
        }
        const trialSubs = await stripe.subscriptions.list({ customer: customer.id, status: "trialing", limit: 1 });
        if (trialSubs.data.length > 0) {
          accessCache.set(cacheKey, { result: true, ts: Date.now() });
          return true;
        }
      }
    } catch (err) {
      console.error("[laborator-auth] Stripe fallback error:", err);
    }
  }

  accessCache.set(cacheKey, { result: false, ts: Date.now() });
  return false;
}
