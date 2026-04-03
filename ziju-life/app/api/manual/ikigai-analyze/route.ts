import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  try {
    const { love, goodAt, worldNeeds, paidFor } = await req.json();

    const prompt = `Na základě těchto 4 odpovědí o uživateli najdi průsečíky a napiš Ikigai analýzu.

❤️ Co miluje: ${(love as string[]).filter(Boolean).join(", ")}
💪 V čem je dobrý/á: ${(goodAt as string[]).filter(Boolean).join(", ")}
🌍 Co svět potřebuje: ${(worldNeeds as string[]).filter(Boolean).join(", ")}
💰 Za co dostává zaplaceno: ${(paidFor as string[]).filter(Boolean).join(", ")}

Odpověz POUZE platným JSON objektem (bez markdown bloků) s těmito klíči:
{
  "passion": "1–2 věty: průsečík ❤️ + 💪 (Vášeň — co miluje A v čem je dobrý/á)",
  "mission": "1–2 věty: průsečík ❤️ + 🌍 (Mise — co miluje A co svět potřebuje)",
  "profession": "1–2 věty: průsečík 💪 + 💰 (Profese — v čem je dobrý/á A za co dostává zaplaceno)",
  "vocation": "1–2 věty: průsečík 🌍 + 💰 (Poslání — co svět potřebuje A za co dostává zaplaceno)",
  "ikigai": "2–3 věty: průsečík všeho — osobní Ikigai tohoto člověka"
}

Piš česky, prakticky, konkrétně pro TOHOTO člověka. Nepiš obecně.`;

    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = result.content[0].type === "text" ? result.content[0].text : "";
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Analýza se nezdařila", details: String(error) }, { status: 500 });
  }
}
