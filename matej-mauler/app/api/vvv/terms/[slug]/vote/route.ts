import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureVvvSchema } from "@/lib/vvvSchema";
import crypto from "crypto";

function getIpHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  return crypto.createHash("sha256").update(ip + "vvv-2024").digest("hex").slice(0, 40);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ipHash = getIpHash(req);
    const sql = getDb();
    await ensureVvvSchema(sql);

    // Check for vote in last 24 hours
    const [existing] = await sql`
      SELECT id FROM vvv_votes
      WHERE term_slug = ${slug}
        AND ip_hash = ${ipHash}
        AND voted_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;

    if (existing) {
      return NextResponse.json(
        { error: "Již jsi hlasoval/a. Limit je 1× za 24 hodin." },
        { status: 429 }
      );
    }

    await sql`INSERT INTO vvv_votes (term_slug, ip_hash) VALUES (${slug}, ${ipHash})`;

    const [row] = await sql`
      UPDATE vvv_terms SET votes = votes + 1
      WHERE slug = ${slug}
      RETURNING votes
    `;

    return NextResponse.json({ votes: row?.votes ?? 0 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
