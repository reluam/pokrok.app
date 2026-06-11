import { NextResponse, type NextRequest } from "next/server";
import { advanceIfDue, ROUND_SEC } from "@/lib/radioServer";

export const dynamic = "force-dynamic";

/** Cron: automatický posun rádia (mutace/aplikace hlasů), i když zrovna nikdo neposlouchá.
    Mezi tiky stav líně dohání /api/radio/state, takže rádio nikdy nezamrzne. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const row = await advanceIfDue();
    return NextResponse.json({ ok: true, roundNo: row.round_no, roundSec: ROUND_SEC });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "db" }, { status: 500 });
  }
}
