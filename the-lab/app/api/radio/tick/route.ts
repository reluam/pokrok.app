import { NextResponse, type NextRequest } from "next/server";
import { ensureRounds } from "@/lib/radioServer";

export const dynamic = "force-dynamic";

/** Cron: drží řetěz kol živý, i když nikdo neposlouchá (mezi tiky dohání /api/radio/now). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { current, next } = await ensureRounds();
    return NextResponse.json({ ok: true, current: current.round_no, next: next?.round_no ?? null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "db" }, { status: 500 });
  }
}
