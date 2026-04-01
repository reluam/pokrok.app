import { sql } from "./database";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { verifyUserSession } from "./user-auth";

// ── Pricing ─────────────────────────────────────────────────────────────────

// Haiku 4.5 pricing in USD per token
const INPUT_PRICE_USD = 0.80 / 1_000_000;   // $0.80/MTok
const OUTPUT_PRICE_USD = 4.00 / 1_000_000;  // $4.00/MTok
const USD_TO_CZK = 24;                       // Approximate exchange rate

/** Annual subscription AI budget in CZK */
const SUBSCRIPTION_BUDGET_CZK = 50;
/** Top-up pack price and budget */
const TOPUP_BUDGET_CZK = 99;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIBudgetBalance {
  /** Remaining budget in CZK */
  remainingCzk: number;
  /** Total budget in CZK (subscription + purchased) */
  totalBudgetCzk: number;
  /** Spent so far in CZK */
  spentCzk: number;
  /** Whether user has active subscription */
  hasSubscription: boolean;
}

// Keep old interface for backward compatibility with Dilna dashboard
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Calculate CZK cost from token counts. */
export function calculateCostCzk(inputTokens: number, outputTokens: number): number {
  const costUsd = inputTokens * INPUT_PRICE_USD + outputTokens * OUTPUT_PRICE_USD;
  return Math.round(costUsd * USD_TO_CZK * 100) / 100; // round to 2 decimals
}

// ── Stripe subscription period ───────────────────────────────────────────────

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

/** Resolve email from cookies. */
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

// ── Budget balance ──────────────────────────────────────────────────────────

export async function getAIBudgetBalance(userId: string): Promise<AIBudgetBalance> {
  const email = await resolveEmail();

  let hasSubscription = false;
  let subscriptionBudget = 0;
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
        subscriptionBudget = SUBSCRIPTION_BUDGET_CZK;
        periodStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
    } catch {}

    if (!hasSubscription) {
      const sub = await getSubscriptionPeriodStart(email);
      hasSubscription = sub.hasSubscription;
      periodStart = sub.periodStart;
      if (hasSubscription) subscriptionBudget = SUBSCRIPTION_BUDGET_CZK;
    }
  }

  // Purchased top-up packs (stored as CZK value in credits column)
  const [{ purchased }] = (await sql`
    SELECT COALESCE(SUM(credits), 0)::numeric AS purchased
    FROM ai_credit_packs
    WHERE user_id = ${userId}
  `) as { purchased: number }[];

  // Calculate actual spend from token usage in current period
  let spentCzk: number;
  if (periodStart) {
    const [{ total_input, total_output }] = (await sql`
      SELECT
        COALESCE(SUM(input_tokens), 0)::int AS total_input,
        COALESCE(SUM(output_tokens), 0)::int AS total_output
      FROM ai_interactions
      WHERE user_id = ${userId}
        AND created_at >= ${periodStart}
    `) as { total_input: number; total_output: number }[];
    spentCzk = calculateCostCzk(total_input, total_output);
  } else {
    const [{ total_input, total_output }] = (await sql`
      SELECT
        COALESCE(SUM(input_tokens), 0)::int AS total_input,
        COALESCE(SUM(output_tokens), 0)::int AS total_output
      FROM ai_interactions
      WHERE user_id = ${userId}
    `) as { total_input: number; total_output: number }[];
    spentCzk = calculateCostCzk(total_input, total_output);
  }

  const totalBudgetCzk = subscriptionBudget + Number(purchased);
  const remainingCzk = Math.max(0, Math.round((totalBudgetCzk - spentCzk) * 100) / 100);

  return { remainingCzk, totalBudgetCzk, spentCzk, hasSubscription };
}

/** Backward-compatible wrapper — maps budget to old credit-count interface. */
export async function getAICreditsBalance(userId: string): Promise<AICreditsBalance> {
  const budget = await getAIBudgetBalance(userId);
  // Approximate: 1 "credit" ≈ 1 CZK of budget
  return {
    available: Math.floor(budget.remainingCzk),
    total: Math.floor(budget.totalBudgetCzk),
    used: Math.ceil(budget.spentCzk),
    hasSubscription: budget.hasSubscription,
  };
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
