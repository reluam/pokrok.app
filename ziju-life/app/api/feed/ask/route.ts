import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAllPublishedPostsFull } from "@/lib/curated-posts-db";
import { getAllPrinciples } from "@/lib/principles";
import { buildFeedAskPrompt } from "@/lib/ai-prompts-feed";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter (per IP, 20 questions / hour)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Příliš mnoho dotazů. Zkus to znovu za chvíli." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const question = String(body.question ?? "").trim();
    const history: { role: "user" | "assistant"; content: string }[] = body.history ?? [];

    if (!question || question.length > 2000) {
      return NextResponse.json(
        { error: "Otázka musí mít 1-2000 znaků." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI služba není nakonfigurovaná." },
        { status: 500 }
      );
    }

    // Load all content for RAG
    const [posts, principles] = await Promise.all([
      getAllPublishedPostsFull(),
      getAllPrinciples(),
    ]);

    const systemPrompt = buildFeedAskPrompt(posts, principles);

    // Build message history
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: question },
    ];

    // Call Anthropic
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawText = result.content[0]?.type === "text" ? result.content[0].text : "";

    // Parse JSON response
    const tryParse = (s: string) => {
      try { return JSON.parse(s); } catch { return null; }
    };

    let parsed = tryParse(rawText.trim());
    if (!parsed) {
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) parsed = tryParse(match[1].trim());
    }
    if (!parsed) {
      const braceStart = rawText.indexOf("{");
      const braceEnd = rawText.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd > braceStart) {
        parsed = tryParse(rawText.slice(braceStart, braceEnd + 1));
      }
    }

    if (parsed?.answer) {
      return NextResponse.json({
        answer: parsed.answer,
        sources: parsed.sources ?? [],
        followUps: parsed.followUps ?? [],
        hasZijuContent: parsed.hasZijuContent ?? false,
      });
    }

    // Fallback: return raw text
    return NextResponse.json({
      answer: rawText,
      sources: [],
      followUps: [],
      hasZijuContent: false,
    });
  } catch (error) {
    console.error("POST /api/feed/ask error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se získat odpověď. Zkus to znovu." },
      { status: 500 }
    );
  }
}
