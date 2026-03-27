import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyUserSession } from "@/lib/user-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getAICreditsBalance, recordAIInteraction } from "@/lib/ai-credits";
import { getToolCards } from "@/lib/toolbox-db";
import { getInspirationData } from "@/lib/inspiration-db";
import { buildInspirationRecommendationPrompt } from "@/lib/ai-prompts";
import { sql, initializeDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

const FREE_MONTHLY_LIMIT = 1;

interface AIRecommendation {
  itemType: "tool" | "inspiration";
  slug?: string;
  id?: string;
  title: string;
  reason: string;
}

interface AIResponse {
  summary: string;
  recommendations: AIRecommendation[];
  closingNote: string;
}

/** Count AI interactions for a user in the current calendar month. */
async function getMonthlyUsage(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ count }] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM ai_interactions
    WHERE user_id = ${userId}
      AND created_at >= ${monthStart}
  `) as { count: number }[];

  return count;
}

export async function POST(request: NextRequest) {
  try {
  await initializeDatabase();

  // Require login (magic link or lab_email)
  const sessionUser = await verifyUserSession();
  if (!sessionUser) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  // Determine if user is a subscriber
  const isSubscriber = await checkLaboratorAccess();
  const labUser = await getLaboratorUser();
  const userId = labUser?.id ?? sessionUser.id;

  if (isSubscriber && labUser) {
    // Subscriber flow — use credit system
    const balance = await getAICreditsBalance(userId);
    if (balance.available <= 0) {
      return NextResponse.json({ error: "no_credits", credits: balance }, { status: 402 });
    }
  } else {
    // Free user — 1 query/month
    const monthlyUsage = await getMonthlyUsage(userId);
    if (monthlyUsage >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json({
        error: "limit_reached",
        message: "Tento měsíc jsi už využil/a svůj bezplatný dotaz. Získej předplatné Laboratoře pro neomezené doporučení.",
      }, { status: 402 });
    }
  }

  // Parse request
  const body = await request.json();
  const message = String(body.message ?? "").trim();
  if (!message || message.length > 2000) {
    return NextResponse.json(
      { error: "Zpráva musí mít 1–2000 znaků." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ai-recommend] Missing ANTHROPIC_API_KEY");
    return NextResponse.json(
      { error: "AI služba není nakonfigurovaná." },
      { status: 500 }
    );
  }
    // Load catalogs
    const { tools } = await getToolCards({ limit: 200 });
    const inspirationData = await getInspirationData(false);
    const allInspirations = [
      ...inspirationData.blogs,
      ...inspirationData.videos,
      ...inspirationData.books,
      ...inspirationData.articles,
      ...inspirationData.other,
      ...inspirationData.music,
      ...inspirationData.reels,
      ...inspirationData.princips,
    ].filter((i) => i.isActive !== false);

    const systemPrompt = buildInspirationRecommendationPrompt(tools, allInspirations);

    // Call Anthropic API
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const rawText =
      result.content[0]?.type === "text" ? result.content[0].text : "";
    const inputTokens = result.usage?.input_tokens ?? 0;
    const outputTokens = result.usage?.output_tokens ?? 0;

    // Parse JSON response
    let parsed: AIResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        parsed = {
          summary: rawText,
          recommendations: [],
          closingNote: "",
        };
      }
    }

    const recommendedSlugs = parsed.recommendations
      .filter((r) => r.itemType === "tool" && r.slug)
      .map((r) => r.slug!);

    // Record the interaction
    await recordAIInteraction(
      userId,
      message,
      JSON.stringify(parsed),
      recommendedSlugs,
      inputTokens,
      outputTokens
    );

    // Return response with credit info
    const responsePayload: Record<string, unknown> = { response: parsed };

    if (isSubscriber && labUser) {
      responsePayload.credits = await getAICreditsBalance(userId);
    } else {
      const monthlyUsage = await getMonthlyUsage(userId);
      responsePayload.freeUsage = {
        used: monthlyUsage,
        limit: FREE_MONTHLY_LIMIT,
        remaining: Math.max(0, FREE_MONTHLY_LIMIT - monthlyUsage),
      };
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("POST /api/inspirace/ai-recommend error:", error instanceof Error ? error.message : error);

    // Handle Anthropic API billing errors
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("credit balance") || errMsg.includes("billing")) {
      return NextResponse.json(
        { error: "AI služba je momentálně nedostupná. Zkus to prosím později." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Nepodařilo se získat doporučení. Zkus to znovu." },
      { status: 500 }
    );
  }
}
