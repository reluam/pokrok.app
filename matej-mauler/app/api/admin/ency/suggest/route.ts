import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { isAdminReq } from "@/lib/adminAuth";
import { NODES, SEEDS } from "@/lib/encyclopedia/nodes";
import { redLinks } from "@/lib/encyclopedia/graph";

// Claude s adaptivním thinkingem může přemýšlet déle než default limit funkce
export const maxDuration = 120;

let ready = false;
async function ensure(sql: ReturnType<typeof getDb>) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS ency_suggestions (
    id SERIAL PRIMARY KEY,
    kind TEXT NOT NULL,
    from_slug TEXT NOT NULL,
    to_slug TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  ready = true;
}

export type Suggestion = { id: number; kind: "synapse" | "topic"; from_slug: string; to_slug: string; title: string; reason: string };

const SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["synapse", "topic"] },
          from: { type: "string", description: "slug existujícího hesla, ze kterého vazba vede" },
          to: { type: "string", description: "slug cíle — existující heslo (synapse), nebo nový kebab-case slug (topic)" },
          title: { type: "string", description: "český název cílového tématu" },
          reason: { type: "string", description: "1–2 věty, proč vazba/téma dává smysl" },
        },
        required: ["kind", "from", "to", "title", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

const SYSTEM = `Jsi redaktor interaktivní encyklopedie Spaghetti.ltd. Encyklopedie je síť hesel propojených synapsemi: "up" = obecnější heslo, "next" = kanonické pokračování trasy (z obecného do konkrétního), "satellites" = boční odbočky. Červené odkazy jsou plánovaná, zatím nenapsaná témata; "wishes" jsou hlasy návštěvníků, co chtějí probádat.

Dostaneš aktuální graf. Navrhni 5–10 nejcennějších doplnění:
- kind "synapse": nová boční vazba mezi DVĚMA EXISTUJÍCÍMI hesly (from i to musí být existující slugy). Hledej obsahově silné spoje napříč větvemi (vesmír↔zvuk↔hudba↔knihovna), které síť zhustí.
- kind "topic": nové téma (to = nový slug, který zatím neexistuje), které by propojilo více větví nebo splnilo přání návštěvníků; from = existující heslo, ze kterého má vazba vést.

Nenavrhuj vazby, které už existují. Piš česky, stručně a věcně.`;

function graphSummary() {
  const nodes = Object.values(NODES).map((n) => ({
    slug: n.slug, realm: n.realm, title: n.title.cs, guide: n.guide.cs,
    up: n.up ?? null, next: n.next ?? null, satellites: (n.satellites ?? []).map((s) => s.to),
  }));
  const red = [...redLinks()].map((slug) => ({ slug, title: SEEDS[slug]?.cs ?? slug }));
  return { nodes, redLinks: red };
}

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const sql = getDb();
    await ensure(sql);
    const suggestions = await sql`SELECT * FROM ency_suggestions ORDER BY id ASC` as Suggestion[];
    const wishes = await sql`SELECT slug, votes FROM topic_wishes ORDER BY votes DESC` as { slug: string; votes: number }[];
    return NextResponse.json({ suggestions, wishes });
  } catch {
    return NextResponse.json({ suggestions: [], wishes: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Chybí ANTHROPIC_API_KEY" }, { status: 500 });
  try {
    const sql = getDb();
    await ensure(sql);
    let wishes: { slug: string; votes: number }[] = [];
    try { wishes = await sql`SELECT slug, votes FROM topic_wishes ORDER BY votes DESC LIMIT 30` as typeof wishes; } catch {}

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Aktuální graf encyklopedie:\n${JSON.stringify({ ...graphSummary(), wishes }, null, 1)}`,
      }],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text) as { suggestions: { kind: "synapse" | "topic"; from: string; to: string; title: string; reason: string }[] };

    await sql`DELETE FROM ency_suggestions`;
    for (const s of parsed.suggestions ?? []) {
      if (!NODES[s.from]) continue; // from musí existovat
      await sql`INSERT INTO ency_suggestions (kind, from_slug, to_slug, title, reason) VALUES (${s.kind}, ${s.from}, ${s.to}, ${s.title}, ${s.reason})`;
    }
    const suggestions = await sql`SELECT * FROM ency_suggestions ORDER BY id ASC` as Suggestion[];
    return NextResponse.json({ suggestions });
  } catch (e) {
    const msg = e instanceof Anthropic.APIError ? `Claude API: ${e.status} ${e.message}` : e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    const sql = getDb();
    await ensure(sql);
    await sql`DELETE FROM ency_suggestions WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
