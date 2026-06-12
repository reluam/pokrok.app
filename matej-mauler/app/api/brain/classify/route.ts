import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAdminReq } from "@/lib/adminAuth";
import { getUnclassifiedWords, setWordPos, WORD_POS, type WordPos } from "@/lib/brainDb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Dávková klasifikace slovních druhů přes Claude (levný model, ~300 slov na zavolání).
 * Spouští: denní cron (GET s CRON_SECRET) nebo admin tlačítko (POST s admin cookie).
 */
async function classify() {
  const words = await getUnclassifiedWords(300);
  if (words.length === 0) return { ok: true, classified: 0, remaining: 0 };

  const anthropic = new Anthropic();
  const list = words.map((w) => `${w.id}\t${w.display}\t${w.lang}`).join("\n");
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: `Classify each word/phrase by part of speech. Lines are "id<TAB>word<TAB>lang" (cs = Czech, en = English):

${list}

Categories: noun, verb, adjective, adverb, other (use "other" for pronouns, numerals, interjections, multi-word phrases that aren't clearly one category, names, etc.).
Reply with ONLY a JSON array, no other text: [{"id":1,"pos":"noun"},...]`,
    }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Claude nevrátil JSON");
  const parsed = JSON.parse(m[0]) as { id: number; pos: string }[];
  const valid = new Set<string>(WORD_POS);
  const items = parsed
    .filter((x) => Number.isInteger(x.id) && valid.has(x.pos))
    .map((x) => ({ id: x.id, pos: x.pos as WordPos }));
  await setWordPos(items);
  const remaining = words.length >= 300 ? "more" : 0;
  return { ok: true, classified: items.length, remaining };
}

// Cron (Vercel posílá GET)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await classify());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "fail" }, { status: 500 });
  }
}

// Admin tlačítko
export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await classify());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "fail" }, { status: 500 });
  }
}
