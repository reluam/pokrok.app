import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { getAIBudgetBalance, recordAIInteraction } from "@/lib/ai-credits";
import { getToolCards } from "@/lib/toolbox-db";
import { getInspirationData } from "@/lib/inspiration-db";
import { buildLabCoachPrompt, type LabUserContext } from "@/lib/ai-prompts";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

/** Ensure coaching tables exist */
async function ensureCoachingTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS coaching_messages (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      role VARCHAR(10) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_coaching_messages_user ON coaching_messages(user_id, created_at)`;
  } catch {}

  await sql`
    CREATE TABLE IF NOT EXISTS user_ai_profile (
      user_id VARCHAR(255) PRIMARY KEY,
      profile_summary TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}

/** Load user context for AI prompt */
async function loadUserContext(userId: string): Promise<LabUserContext> {
  const rows = (await sql`
    SELECT context_type, data FROM user_lab_context WHERE user_id = ${userId}
  `) as { context_type: string; data: Record<string, unknown> }[];

  const context: LabUserContext = {};
  for (const row of rows) {
    if (row.context_type === "values" && Array.isArray(row.data)) {
      context.values = row.data as { name: string; alignment: number }[];
    } else if (row.context_type === "compass" && Array.isArray(row.data)) {
      context.compass = row.data as { area: string; current: number; goal: number }[];
    } else if (row.context_type === "rituals" && Array.isArray(row.data)) {
      context.rituals = row.data as { slot: string; name: string; duration?: string }[];
    } else if (row.context_type === "priorities" && row.data) {
      context.priorities = row.data as LabUserContext["priorities"];
    }
  }

  try {
    const checkins = (await sql`
      SELECT week_start_date, score FROM weekly_checkins
      WHERE user_id = ${userId} ORDER BY week_start_date DESC LIMIT 8
    `) as { week_start_date: string; score: number }[];
    if (checkins.length > 0) {
      context.checkinTrend = checkins.reverse().map(c => ({ week: String(c.week_start_date), avgScore: c.score }));
    }
  } catch {}

  return context;
}

/** GET — load conversation history */
export async function GET(request: NextRequest) {
  try {

    await ensureCoachingTables();

    const user = await getLaboratorUser(request);
    if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

    const valid = await checkLaboratorAccess(user.email);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const messages = (await sql`
      SELECT role, content, created_at FROM coaching_messages
      WHERE user_id = ${user.id}
      ORDER BY created_at ASC
      LIMIT 50
    `) as { role: string; content: string; created_at: string }[];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/laborator/coaching-chat error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/** POST — send message, get AI response */
export async function POST(request: NextRequest) {
  try {

    await ensureCoachingTables();

    const user = await getLaboratorUser(request);
    if (!user) return NextResponse.json({ error: "No user" }, { status: 400 });

    const valid = await checkLaboratorAccess(user.email);
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Budget check
    const budget = await getAIBudgetBalance(user.id);
    if (budget.remainingCzk <= 0) {
      return NextResponse.json({ error: "no_budget", budget, message: "Tvůj AI rozpočet je vyčerpaný." }, { status: 402 });
    }

    const body = await request.json();
    const userMessage = String(body.message ?? "").trim();
    if (!userMessage || userMessage.length > 2000) {
      return NextResponse.json({ error: "Zpráva musí mít 1–2000 znaků." }, { status: 400 });
    }

    // Save user message
    const userMsgId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await sql`
      INSERT INTO coaching_messages (id, user_id, role, content, created_at)
      VALUES (${userMsgId}, ${user.id}, 'user', ${userMessage}, NOW())
    `;

    // Load conversation history
    const history = (await sql`
      SELECT role, content FROM coaching_messages
      WHERE user_id = ${user.id}
      ORDER BY created_at ASC
      LIMIT 50
    `) as { role: string; content: string }[];

    // Load AI profile
    let profileSummary = "";
    try {
      const profileRows = (await sql`
        SELECT profile_summary FROM user_ai_profile WHERE user_id = ${user.id}
      `) as { profile_summary: string | null }[];
      profileSummary = profileRows[0]?.profile_summary || "";
    } catch {}

    // Build system prompt
    const userContext = await loadUserContext(user.id);
    const { tools } = await getToolCards({ limit: 200 });
    const inspirationData = await getInspirationData(false);
    const allInspirations = [
      ...inspirationData.blogs, ...inspirationData.videos, ...inspirationData.books,
      ...inspirationData.articles, ...inspirationData.other, ...inspirationData.music,
      ...inspirationData.reels, ...inspirationData.princips,
    ].filter(i => i.isActive !== false);

    const basePrompt = buildLabCoachPrompt(userContext, tools, allInspirations);

    const profileSection = profileSummary
      ? `\n\n## Profil uživatele (z předchozích konverzací)\n${profileSummary}\n`
      : "";

    const systemPrompt = `${basePrompt}${profileSection}

## Kontext koučovací konverzace
Toto je dlouhodobá koučovací konverzace. Pamatuješ si celou historii. Buď empatický, podporující kouč.
Odpovídej přirozeně česky, stručně ale s hloubkou. Pomáhej uživateli růst.`;

    // Call Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI služba není nakonfigurovaná." }, { status: 500 });

    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    const aiText = result.content[0]?.type === "text" ? result.content[0].text : "";
    const inputTokens = result.usage?.input_tokens ?? 0;
    const outputTokens = result.usage?.output_tokens ?? 0;

    // Save AI response
    const aiMsgId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await sql`
      INSERT INTO coaching_messages (id, user_id, role, content, created_at)
      VALUES (${aiMsgId}, ${user.id}, 'assistant', ${aiText}, NOW())
    `;

    // Record interaction for billing
    await recordAIInteraction(user.id, userMessage, aiText, [], inputTokens, outputTokens);

    // Every 10 messages — update AI profile
    const msgCount = (await sql`
      SELECT COUNT(*)::int AS count FROM coaching_messages WHERE user_id = ${user.id}
    `) as { count: number }[];

    if (msgCount[0]?.count && msgCount[0].count % 10 === 0) {
      // Generate profile update in background (don't block response)
      updateAIProfile(user.id, history, aiText, apiKey, systemPrompt).catch(console.error);
    }

    return NextResponse.json({
      message: aiText,
      budget: await getAIBudgetBalance(user.id),
    });
  } catch (error) {
    console.error("POST /api/laborator/coaching-chat error:", error);
    return NextResponse.json({ error: "Nepodařilo se získat odpověď." }, { status: 500 });
  }
}

/** Generate/update AI profile summary from conversation history */
async function updateAIProfile(
  userId: string,
  history: { role: string; content: string }[],
  latestResponse: string,
  apiKey: string,
  _systemPrompt: string
) {
  const anthropic = new Anthropic({ apiKey });

  const summaryMessages = history.slice(-20).map(m => `${m.role}: ${m.content}`).join("\n");

  const result = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: `Jsi analytik. Z konverzace mezi koučem a uživatelem vytvoř stručný profil uživatele (max 300 slov).
Zaměř se na: cíle, hodnoty, výzvy, silné stránky, osobnostní rysy, aktuální životní situace, motivace.
Piš ve 3. osobě, česky. Jen fakta zjištěná z konverzace, žádné domněnky.`,
    messages: [{ role: "user", content: `Konverzace:\n${summaryMessages}\n\nVytvoř profil uživatele:` }],
  });

  const summary = result.content[0]?.type === "text" ? result.content[0].text : "";
  if (summary) {
    await sql`
      INSERT INTO user_ai_profile (user_id, profile_summary, updated_at)
      VALUES (${userId}, ${summary}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET profile_summary = ${summary}, updated_at = NOW()
    `;
  }
}
