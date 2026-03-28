import { cookies } from "next/headers";
import Stripe from "stripe";
import { verifyUserSession } from "@/lib/user-auth";
import { sql } from "@/lib/database";

/**
 * In-memory cache for Stripe subscription checks.
 * Avoids repeated Stripe API calls within the same serverless invocation
 * and across rapid subsequent requests (TTL: 60s).
 */
const accessCache = new Map<string, { result: boolean; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Server-side check: verifies active Laboratoř access.
 *
 * Email is resolved in priority order:
 * 1. lab_email cookie (set after Stripe checkout flow)
 * 2. Existing DB user session (set after magic link login via /api/auth/magic-link)
 *
 * Access granted if:
 * A) Admin-granted free access exists in laborator_grants (checked first, cheaper)
 * B) Active/trialing Stripe subscription (cached for 60s)
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

  // Check cache first
  const cached = accessCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.result;
  }

  // A) Check admin-granted free access first (no Stripe round-trip needed)
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
    // DB unavailable — fall through to Stripe check
  }

  // B) Check Stripe subscription (cached result)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return false;

  try {
    const stripe = new Stripe(stripeSecretKey);
    const customers = await stripe.customers.list({ email: cacheKey, limit: 5 });

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        accessCache.set(cacheKey, { result: true, ts: Date.now() });
        return true;
      }
      const trialSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "trialing",
        limit: 1,
      });
      if (trialSubs.data.length > 0) {
        accessCache.set(cacheKey, { result: true, ts: Date.now() });
        return true;
      }
    }
  } catch (err) {
    console.error("[laborator-auth]", err);
  }

  accessCache.set(cacheKey, { result: false, ts: Date.now() });
  return false;
}
