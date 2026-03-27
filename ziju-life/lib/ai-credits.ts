import { sql } from "./database";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { verifyUserSession } from "./user-auth";

const SUBSCRIPTION_CREDITS = 15;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AICreditsBalance {
  available: number;
  total: number;
  used: number;
  hasSubscription: boolean;
}

export interface AIInteraction {
  id: string;
  userMessage: string;
  aiResponse: string;
  recommendedSlugs: string[];
  createdAt: string;
}

// ── Stripe subscription period ───────────────────────────────────────────────

/**
 * Resolve the current subscription period start for the user's Laboratoř sub.
 * Returns ISO date string or null if no active subscription.
 */
async function getSubscriptionPeriodStart(email: string): Promise<{ hasSubscription: boolean; periodStart: Date | null }> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return { hasSubscription: false, periodStart: null };

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
        if (subs.data.length > 0) {
          const sub = subs.data[0] as unknown as Record<string, unknown>;
          const periodStartUnix = sub.current_period_start as number | undefined;
          return {
            hasSubscription: true,
            periodStart: periodStartUnix ? new Date(periodStartUnix * 1000) : new Date(),
          };
        }
      }
    }
  } catch (err) {
    console.error("[ai-credits] Stripe error:", err);
  }

  return { hasSubscription: false, periodStart: null };
}

/** Resolve email from cookies (same logic as laborator-auth). */
async function resolveEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get("lab_email")?.value?.trim();

  let sessionEmail: string | undefined;
  try {
    const user = await verifyUserSession();
    sessionEmail = user?.email;
  } catch {}

  return cookieEmail || sessionEmail || null;
}

// ── Credits balance ──────────────────────────────────────────────────────────

export async function getAICreditsBalance(userId: string): Promise<AICreditsBalance> {
  const email = await resolveEmail();

  // Check subscription status and period
  let hasSubscription = false;
  let subscriptionCredits = 0;
  let periodStart: Date | null = null;

  if (email) {
    // Check admin grants first
    try {
      const grants = await sql`
        SELECT id FROM laborator_grants
        WHERE email = ${email.toLowerCase()}
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `;
      if (grants.length > 0) {
        hasSubscription = true;
        subscriptionCredits = SUBSCRIPTION_CREDITS;
        // For grants, count interactions from last 365 days as "period"
        periodStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
    } catch {}

    if (!hasSubscription) {
      const sub = await getSubscriptionPeriodStart(email);
      hasSubscription = sub.hasSubscription;
      periodStart = sub.periodStart;
      if (hasSubscription) subscriptionCredits = SUBSCRIPTION_CREDITS;
    }
  }

  // Count purchased credits (all time — they don't expire)
  const [{ purchased }] = (await sql`
    SELECT COALESCE(SUM(credits), 0)::int AS purchased
    FROM ai_credit_packs
    WHERE user_id = ${userId}
  `) as { purchased: number }[];

  // Count used interactions in current subscription period
  let used: number;
  if (periodStart) {
    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count
      FROM ai_interactions
      WHERE user_id = ${userId}
        AND created_at >= ${periodStart}
    `) as { count: number }[];
    used = count;
  } else {
    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count
      FROM ai_interactions
      WHERE user_id = ${userId}
    `) as { count: number }[];
    used = count;
  }

  const total = subscriptionCredits + purchased;
  const available = Math.max(0, total - used);

  return { available, total, used, hasSubscription };
}

// ── Record interaction ───────────────────────────────────────────────────────

export async function recordAIInteraction(
  userId: string,
  userMessage: string,
  aiResponse: string,
  recommendedSlugs: string[],
  inputTokens: number,
  outputTokens: number
): Promise<string> {
  const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await sql`
    INSERT INTO ai_interactions (id, user_id, user_message, ai_response, recommended_slugs, input_tokens, output_tokens, created_at)
    VALUES (${id}, ${userId}, ${userMessage}, ${aiResponse}, ${recommendedSlugs}, ${inputTokens}, ${outputTokens}, NOW())
  `;

  return id;
}

// ── History ──────────────────────────────────────────────────────────────────

export async function getUserAIHistory(userId: string, limit = 5): Promise<AIInteraction[]> {
  const rows = (await sql`
    SELECT id, user_message, ai_response, recommended_slugs, created_at
    FROM ai_interactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as {
    id: string;
    user_message: string;
    ai_response: string;
    recommended_slugs: string[] | null;
    created_at: Date;
  }[];

  return rows.map((r) => ({
    id: r.id,
    userMessage: r.user_message,
    aiResponse: r.ai_response,
    recommendedSlugs: r.recommended_slugs ?? [],
    createdAt: r.created_at.toISOString(),
  }));
}
