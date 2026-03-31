import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, title } = await request.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  try {
    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Jsi copywriter pro web žiju.life — platformu o vědomém žití a osobním rozvoji.

Tvůj úkol: přepiš zadaný text do stylu žiju.life. Zachovej věcný obsah, ale uprav tón:
- Tykej, piš přátelsky a lidsky — jako kamarád, který sdílí zajímavý objev
- Buď konkrétní a praktický, ne akademický
- Používej krátké věty, aktivní slovesa
- Můžeš přidat emoji (max 1-2, jen když to sedí)
- Piš česky, přirozeně, bez klišé
- Délka: 2-4 věty, stručné a výstižné
- NEPIŠ nadpisy, odrážky ani formátování — jen plynulý text
- Na konci můžeš přidat krátkou praktickou radu nebo otázku k zamyšlení

Vrať POUZE přepsaný text, nic jiného.`,
      messages: [{ role: "user", content: `Článek: "${title}"\n\nPůvodní text:\n${text}` }],
    });

    const rewritten = result.content[0]?.type === "text" ? result.content[0].text : text;
    return NextResponse.json({ text: rewritten });
  } catch (error) {
    console.error("Rewrite error:", error);
    return NextResponse.json({ text }); // fallback to original
  }
}
