import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

// Claude Sonnet pricing (USD per 1M tokens) → CZK via ~23 CZK/USD
const INPUT_COST_CZK_PER_TOKEN = (3 / 1_000_000) * 23;
const OUTPUT_COST_CZK_PER_TOKEN = (15 / 1_000_000) * 23;

function calculateCostCzk(inputTokens: number, outputTokens: number): number {
  const total = inputTokens * INPUT_COST_CZK_PER_TOKEN + outputTokens * OUTPUT_COST_CZK_PER_TOKEN;
  return Math.round(total * 100) / 100;
}

export async function GET() {
  try {
    // Overall totals
    const [totals] = (await sql`
      SELECT
        COUNT(DISTINCT user_id)::int AS total_users,
        COUNT(*)::int AS total_interactions,
        COALESCE(SUM(input_tokens), 0)::bigint AS total_input_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint AS total_output_tokens
      FROM ai_interactions
    `) as { total_users: number; total_interactions: number; total_input_tokens: number; total_output_tokens: number }[];

    const totalCostCzk = calculateCostCzk(
      Number(totals.total_input_tokens),
      Number(totals.total_output_tokens)
    );

    // Revenue from top-up packs
    const [{ topup_revenue }] = (await sql`
      SELECT COALESCE(SUM(credits), 0)::numeric AS topup_revenue
      FROM ai_credit_packs
    `) as { topup_revenue: number }[];

    const totalRevenueCzk = Number(topup_revenue);

    // Per-user breakdown
    const perUser = (await sql`
      SELECT
        ai.user_id,
        u.email,
        COUNT(*)::int AS interactions,
        COALESCE(SUM(ai.input_tokens), 0)::bigint AS input_tokens,
        COALESCE(SUM(ai.output_tokens), 0)::bigint AS output_tokens,
        MIN(ai.created_at) AS first_interaction,
        MAX(ai.created_at) AS last_interaction
      FROM ai_interactions ai
      LEFT JOIN users u ON u.id = ai.user_id
      GROUP BY ai.user_id, u.email
      ORDER BY SUM(ai.input_tokens) + SUM(ai.output_tokens) DESC
    `) as {
      user_id: string;
      email: string | null;
      interactions: number;
      input_tokens: number;
      output_tokens: number;
      first_interaction: Date;
      last_interaction: Date;
    }[];

    const users = perUser.map((row) => ({
      userId: row.user_id,
      email: row.email ?? "—",
      interactions: row.interactions,
      inputTokens: Number(row.input_tokens),
      outputTokens: Number(row.output_tokens),
      costCzk: calculateCostCzk(Number(row.input_tokens), Number(row.output_tokens)),
      firstInteraction: row.first_interaction?.toISOString(),
      lastInteraction: row.last_interaction?.toISOString(),
    }));

    // Monthly breakdown
    const monthly = (await sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*)::int AS interactions,
        COUNT(DISTINCT user_id)::int AS unique_users,
        COALESCE(SUM(input_tokens), 0)::bigint AS input_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint AS output_tokens
      FROM ai_interactions
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `) as {
      month: string;
      interactions: number;
      unique_users: number;
      input_tokens: number;
      output_tokens: number;
    }[];

    const monthlyStats = monthly.map((row) => ({
      month: row.month,
      interactions: row.interactions,
      uniqueUsers: row.unique_users,
      costCzk: calculateCostCzk(Number(row.input_tokens), Number(row.output_tokens)),
    }));

    return NextResponse.json({
      totals: {
        users: totals.total_users,
        interactions: totals.total_interactions,
        inputTokens: Number(totals.total_input_tokens),
        outputTokens: Number(totals.total_output_tokens),
        costCzk: totalCostCzk,
        avgCostPerUser: totals.total_users > 0 ? Math.round((totalCostCzk / totals.total_users) * 100) / 100 : 0,
        avgCostPerInteraction: totals.total_interactions > 0 ? Math.round((totalCostCzk / totals.total_interactions) * 100) / 100 : 0,
      },
      revenue: {
        topupCzk: Number(topup_revenue),
        totalCzk: totalRevenueCzk,
        profitCzk: Math.round((totalRevenueCzk - totalCostCzk) * 100) / 100,
      },
      users,
      monthly: monthlyStats,
    });
  } catch (error) {
    console.error("GET /api/admin/ai-stats error:", error);
    return NextResponse.json({ error: "Failed to load AI stats" }, { status: 500 });
  }
}
