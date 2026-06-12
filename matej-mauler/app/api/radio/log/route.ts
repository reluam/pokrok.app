import { NextRequest, NextResponse } from "next/server";
import { getLog } from "@/lib/radioServer";

export const dynamic = "force-dynamic";

// Log změn rádia, nejnovější první. ?before=ID (starší), ?after=ID (novější než), ?limit.
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const num = (k: string) => { const v = sp.get(k); const n = v ? Number(v) : NaN; return Number.isInteger(n) ? n : undefined; };
    const data = await getLog({ before: num("before"), after: num("after"), limit: num("limit") });
    return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "db" }, { status: 500 });
  }
}
