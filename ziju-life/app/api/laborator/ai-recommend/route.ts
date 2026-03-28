import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { getAICreditsBalance, recordAIInteraction } from "@/lib/ai-credits";
import { getToolCards } from "@/lib/toolbox-db";
import { buildToolRecommendationPrompt } from "@/lib/ai-prompts";

export const dynamic = "force-dynamic";

interface AIRecommendation {
  slug: string;
  title: string;
  reason: string;
}

interface AIResponse {
  summary: string;
  recommendations: AIRecommendation[];
  closingNote: string;
}

export async function POST(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check credits
  const balance = await getAICreditsBalance(user.id);
  if (balance.available <= 0) {
    return NextResponse.json({ error: "no_credits", credits: balance }, { status: 402 });
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

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ai-recommend] Missing ANTHROPIC_API_KEY");
    return NextResponse.json(
      { error: "AI služba není nakonfigurovaná." },
      { status: 500 }
    );
  }

  try {
    // Load tool catalog for prompt
    const { tools } = await getToolCards({ limit: 200 });
    const systemPrompt = buildToolRecommendationPrompt(tools);

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
      // Try direct parse first
      parsed = JSON.parse(rawText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Fallback: return raw text as summary
        parsed = {
          summary: rawText,
          recommendations: [],
          closingNote: "",
        };
      }
    }

    const recommendedSlugs = parsed.recommendations.map((r) => r.slug);

    // Record the interaction (consumes 1 credit)
    await recordAIInteraction(
      user.id,
      message,
      JSON.stringify(parsed),
      recommendedSlugs,
      inputTokens,
      outputTokens
    );

    // Return updated balance
    const updatedBalance = await getAICreditsBalance(user.id);

    return NextResponse.json({
      response: parsed,
      credits: updatedBalance,
    });
  } catch (error) {
    console.error("POST /api/laborator/ai-recommend error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se získat doporučení. Zkus to znovu." },
      { status: 500 }
    );
  }
}
