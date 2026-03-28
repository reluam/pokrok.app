import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { getAIBudgetBalance, recordAIInteraction } from "@/lib/ai-credits";
import { getToolCards } from "@/lib/toolbox-db";
import { getInspirationData } from "@/lib/inspiration-db";
import { buildLabCoachPrompt, type LabUserContext } from "@/lib/ai-prompts";
import { sql } from "@/lib/database";
import { sendContentRequestEmail } from "@/lib/user-email";
import { getAIProfileSummary } from "@/lib/ai-profile";

export const dynamic = "force-dynamic";

interface AIAction {
  type: string;
  [key: string]: unknown;
}

interface AIResponse {
  summary: string;
  recommendations?: { itemType: string; slug?: string; id?: string; title: string; icon?: string; reason: string }[];
  actions?: AIAction[];
  closingNote?: string;
}

/** Load user context from DB */
async function loadUserContext(userId: string): Promise<LabUserContext> {
  const rows = (await sql`
    SELECT context_type, data FROM user_lab_context WHERE user_id = ${userId}
  `) as { context_type: string; data: Record<string, unknown> }[];

  const context: LabUserContext = {};

  for (const row of rows) {
    if (row.context_type === "values" && Array.isArray(row.data)) {
      context.values = (row.data as { name: string; alignment: number }[]).slice(0, 10);
    } else if (row.context_type === "compass" && Array.isArray(row.data)) {
      context.compass = (row.data as { area: string; current: number; goal: number }[]);
    } else if (row.context_type === "rituals" && Array.isArray(row.data)) {
      context.rituals = (row.data as { slot: string; name: string; duration?: string }[]);
    } else if (row.context_type === "priorities" && row.data && typeof row.data === "object") {
      context.priorities = row.data as LabUserContext["priorities"];
    }
  }

  // Load focus area
  try {
    const focusRows = (await sql`
      SELECT area_key FROM user_focus_areas
      WHERE user_id = ${userId} AND completed_at IS NULL
      ORDER BY started_at DESC LIMIT 1
    `) as { area_key: string }[];
    if (focusRows[0]) context.focusArea = focusRows[0].area_key;
  } catch {}

  // Load check-in trend
  try {
    const checkins = (await sql`
      SELECT week_start_date, score FROM weekly_checkins
      WHERE user_id = ${userId}
      ORDER BY week_start_date DESC LIMIT 8
    `) as { week_start_date: string; score: number }[];
    if (checkins.length > 0) {
      context.checkinTrend = checkins.reverse().map((c) => ({
        week: String(c.week_start_date),
        avgScore: c.score,
      }));
    }
  } catch {}

  return context;
}

export async function POST(request: NextRequest) {
  try {


    const user = await getLaboratorUser(request);
    if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

    const valid = await checkLaboratorAccess(user.email);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check budget
    const budget = await getAIBudgetBalance(user.id);
    if (budget.remainingCzk <= 0) {
      return NextResponse.json({
        error: "no_budget",
        budget,
        message: "Tvůj AI rozpočet je vyčerpaný.",
      }, { status: 402 });
    }

    // Parse messages
    const body = await request.json();
    const messages: { role: "user" | "assistant"; content: string }[] = body.messages ?? [];
    if (body.message && !messages.length) {
      messages.push({ role: "user", content: String(body.message).trim() });
    }

    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMsg || !lastUserMsg.content.trim() || lastUserMsg.content.length > 2000) {
      return NextResponse.json({ error: "Zpráva musí mít 1–2000 znaků." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI služba není nakonfigurovaná." }, { status: 500 });
    }

    // Load context + catalogs
    const userContext = await loadUserContext(user.id);
    const { tools } = await getToolCards({ limit: 200 });
    const inspirationData = await getInspirationData(false);
    const allInspirations = [
      ...inspirationData.blogs, ...inspirationData.videos, ...inspirationData.books,
      ...inspirationData.articles, ...inspirationData.other, ...inspirationData.music,
      ...inspirationData.reels, ...inspirationData.princips,
    ].filter((i) => i.isActive !== false);

    const profileSummary = await getAIProfileSummary(user.id);
    const profileSection = profileSummary ? `\n\n## Profil uživatele\n${profileSummary}` : "";
    const systemPrompt = buildLabCoachPrompt(userContext, tools, allInspirations) + profileSection;

    // Call Anthropic
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawText = result.content[0]?.type === "text" ? result.content[0].text : "";
    const inputTokens = result.usage?.input_tokens ?? 0;
    const outputTokens = result.usage?.output_tokens ?? 0;

    // Try parsing JSON
    let parsed: AIResponse | null = null;
    let cannotHelp: { cannot_help: true; topic: string } | null = null;
    const trimmed = rawText.trim();

    const tryParse = (s: string) => {
      try { return JSON.parse(s); } catch { return null; }
    };

    let jsonObj = tryParse(trimmed);
    if (!jsonObj) {
      const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) jsonObj = tryParse(match[1].trim());
    }
    if (!jsonObj) {
      const braceStart = trimmed.indexOf("{");
      const braceEnd = trimmed.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd > braceStart) {
        jsonObj = tryParse(trimmed.slice(braceStart, braceEnd + 1));
      }
    }

    if (jsonObj?.cannot_help) {
      cannotHelp = jsonObj;
    } else if (jsonObj?.recommendations?.length > 0 || jsonObj?.actions?.length > 0 || jsonObj?.summary) {
      parsed = jsonObj;
    }

    const isReflection = !parsed && !cannotHelp;

    // Handle cannot_help — send email to admin
    if (cannotHelp) {
      try {
        await sendContentRequestEmail(cannotHelp.topic, lastUserMsg.content);
      } catch (e) {
        console.error("Failed to send content request email:", e);
      }
    }

    // Record interaction (only for recommendations, not reflections)
    if (!isReflection) {
      const recommendedSlugs = parsed?.recommendations
        ?.filter((r) => r.itemType === "tool" && r.slug)
        .map((r) => r.slug!) ?? [];

      await recordAIInteraction(
        user.id,
        lastUserMsg.content,
        JSON.stringify(parsed ?? cannotHelp),
        recommendedSlugs,
        inputTokens,
        outputTokens
      );
    }

    // Build response
    if (cannotHelp) {
      return NextResponse.json({
        type: "cannot_help",
        topic: cannotHelp.topic,
        budget: await getAIBudgetBalance(user.id),
      });
    }

    if (isReflection) {
      return NextResponse.json({ type: "reflection", text: rawText });
    }

    return NextResponse.json({
      type: "recommendations",
      response: parsed,
      budget: await getAIBudgetBalance(user.id),
    });
  } catch (error) {
    console.error("POST /api/laborator/ai-coach error:", error instanceof Error ? error.message : error);

    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("credit balance") || errMsg.includes("billing")) {
      return NextResponse.json(
        { error: "AI služba je momentálně nedostupná. Zkus to prosím později." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Nepodařilo se získat odpověď. Zkus to znovu." },
      { status: 500 }
    );
  }
}
