import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const MONTHLY_LIMIT = 10;
const COOKIE_NAME = "guest_chat_usage";

/** Parse cookie value: "YYYY-MM:count" */
function parseUsage(cookie: string | undefined): { month: string; count: number } {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (!cookie) return { month: currentMonth, count: 0 };

  const [month, countStr] = cookie.split(":");
  if (month !== currentMonth) return { month: currentMonth, count: 0 };

  return { month: currentMonth, count: parseInt(countStr, 10) || 0 };
}

const SYSTEM_PROMPT = `Jsi chytrý životní průvodce na platformě Žiju life — společník a průvodce na cestě osobního rozvoje.

O platformě Žiju life:
- Průvodce: AI průvodce životem — tvůj osobní společník pro osobní růst, životní změny a hledání smyslu
- Laboratoř: interaktivní prostor s cvičeními (Kompas hodnot, Moje hodnoty, Nastav si den) — pro předplatitele
- Feed: kurátorský výběr tipů a digestů z oblasti osobního rozvoje

Tvůj přístup — rozhoduj se sám podle situace:
1. **Reflective inquiring** — použij, když uživatel sdílí emoce, vnitřní boj nebo nejasný problém. Zrcadli zpět, polož otázku.
2. **Přímá rada** — použij, když uživatel má konkrétní otázku nebo jasný problém. Shrň situaci a rovnou poraď.

Pravidla:
- Tykej, buď přátelský a lidský. Max 4-5 vět na odpověď.
- Odpovídej jako běžný text (nikdy JSON).
- Jsi tu pro návštěvníky webu, kteří se chtějí dozvědět víc o osobním rozvoji nebo o platformě.
- Když je to relevantní, můžeš zmínit, že Laboratoř nabízí personalizovanou práci na sobě.
- Nebuď prodejní — buď užitečný a autentický.

Pokud ti téma nespadá do osobního rozvoje, zdvořile odmítni.`;

export async function POST(request: NextRequest) {
  try {
    // Check rate limit from cookie
    const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
    const usage = parseUsage(cookieValue);

    if (usage.count >= MONTHLY_LIMIT) {
      return NextResponse.json(
        { error: "limit_reached", message: "Dosáhl jsi měsíčního limitu zpráv. Pro neomezený přístup se zaregistruj." },
        { status: 429 }
      );
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

    const anthropic = new Anthropic({ apiKey });
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawText = result.content[0]?.type === "text" ? result.content[0].text : "";

    // Increment usage and set cookie
    const newCount = usage.count + 1;
    const response = NextResponse.json({
      type: "reflection",
      text: rawText,
      remaining: MONTHLY_LIMIT - newCount,
    });

    // Cookie expires at end of month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    response.cookies.set(COOKIE_NAME, `${usage.month}:${newCount}`, {
      expires: endOfMonth,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/guest-chat error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Nepodařilo se získat odpověď. Zkus to znovu." },
      { status: 500 }
    );
  }
}
