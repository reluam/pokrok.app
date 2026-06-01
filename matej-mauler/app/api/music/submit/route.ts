import { NextRequest, NextResponse } from "next/server";
import { submitPart } from "@/lib/musicServer";
import type { PartEvent } from "@/lib/music";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { partId, token, events, email } = await req.json();
    if (typeof partId !== "number" || typeof token !== "string" || !Array.isArray(events)) {
      return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
    }
    const res = await submitPart(partId, token, events as PartEvent[], typeof email === "string" ? email : null);
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
