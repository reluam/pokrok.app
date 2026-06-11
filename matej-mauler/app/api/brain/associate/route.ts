import { NextRequest, NextResponse } from "next/server";
import { associate } from "@/lib/brainDb";

export const dynamic = "force-dynamic";

// Uloží asociaci { from: id slova, to: text } → posílí (nebo vytvoří) synapsi from → to.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const fromId = Number(b.from);
    const toRaw = String(b.to ?? "");
    if (!Number.isInteger(fromId) || !toRaw) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    const result = await associate(fromId, toRaw.slice(0, 200));
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "unknown-from" ? 404 : 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
