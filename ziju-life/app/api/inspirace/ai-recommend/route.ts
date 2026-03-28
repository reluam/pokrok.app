import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedUser } from "@/lib/user-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getAIBudgetBalance, recordAIInteraction } from "@/lib/ai-credits";
import { getToolCards } from "@/lib/toolbox-db";
import { getInspirationData } from "@/lib/inspiration-db";
import { buildInspirationRecommendationPrompt } from "@/lib/ai-prompts";
import { sql } from "@/lib/database";
import { getAIProfileSummary } from "@/lib/ai-profile";

export const dynamic = "force-dynamic";

const FREE_MONTHLY_LIMIT = 10;

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


  // Require login (Bearer token or cookie session)
  const sessionUser = await getAuthenticatedUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  // Determine if user is a subscriber
  const isSubscriber = await checkLaboratorAccess(sessionUser.email);
  const labUser = await getLaboratorUser(request);
  const userId = labUser?.id ?? sessionUser.id;

  if (isSubscriber && labUser) {
    // Subscriber flow — check budget (50 CZK included, top-ups available)
    const budget = await getAIBudgetBalance(userId);
    if (budget.remainingCzk <= 0) {
      return NextResponse.json({
        error: "no_budget",
        budget,
        message: "Tvůj AI rozpočet je vyčerpaný. Můžeš si ho obnovit za 99 Kč, nebo se obnoví automaticky s dalším ročním předplatným.",
      }, { status: 402 });
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

  // Parse request — supports single message or conversation history
  const body = await request.json();
  const messages: { role: "user" | "assistant"; content: string }[] = body.messages ?? [];

  // Backward compat: single message field
  if (!messages.length && body.message) {
    messages.push({ role: "user", content: String(body.message).trim() });
  }

  const lastUserMsg = messages.filter((m) => m.role === "user").pop();
  if (!lastUserMsg || !lastUserMsg.content.trim() || lastUserMsg.content.length > 2000) {
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

    const profileSummary = await getAIProfileSummary(userId);
    const profileSection = profileSummary ? `\n\n## Profil uživatele\n${profileSummary}` : "";
    const systemPrompt = buildInspirationRecommendationPrompt(tools, allInspirations) + profileSection;

    // Call Anthropic API with full conversation history
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawText =
      result.content[0]?.type === "text" ? result.content[0].text : "";
    const inputTokens = result.usage?.input_tokens ?? 0;
    const outputTokens = result.usage?.output_tokens ?? 0;

    // Try parsing as JSON (recommendations). If it fails, it's a reflection (plain text).
    let parsed: AIResponse | null = null;
    const trimmed = rawText.trim();
    // 1. Direct JSON parse
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // 2. Extract from markdown code block (```json ... ``` or ``` ... ```)
      const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1].trim()); } catch {}
      }
      // 3. Find first { ... } in the text
      if (!parsed) {
        const braceStart = trimmed.indexOf("{");
        const braceEnd = trimmed.lastIndexOf("}");
        if (braceStart !== -1 && braceEnd > braceStart) {
          try { parsed = JSON.parse(trimmed.slice(braceStart, braceEnd + 1)); } catch {}
        }
      }
    }

    const isReflection = !parsed || !parsed.recommendations || parsed.recommendations.length === 0;

    // Record the interaction (only count credit on final recommendation step)
    const userMsgForLog = lastUserMsg.content;
    if (!isReflection) {
      const recommendedSlugs = parsed!.recommendations
        .filter((r) => r.itemType === "tool" && r.slug)
        .map((r) => r.slug!);

      await recordAIInteraction(
        userId,
        userMsgForLog,
        JSON.stringify(parsed),
        recommendedSlugs,
        inputTokens,
        outputTokens
      );
    }

    // Build response
    const responsePayload: Record<string, unknown> = isReflection
      ? { type: "reflection", text: rawText }
      : { type: "recommendations", response: parsed };

    if (!isReflection) {
      if (isSubscriber && labUser) {
        responsePayload.budget = await getAIBudgetBalance(userId);
      } else {
        const monthlyUsage = await getMonthlyUsage(userId);
        responsePayload.freeUsage = {
          used: monthlyUsage,
          limit: FREE_MONTHLY_LIMIT,
          remaining: Math.max(0, FREE_MONTHLY_LIMIT - monthlyUsage),
        };
      }
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
