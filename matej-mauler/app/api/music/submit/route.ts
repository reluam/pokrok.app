import { NextRequest, NextResponse } from "next/server";
import { submitPart } from "@/lib/musicServer";
import type { PartData } from "@/lib/music";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { partId, token, data, email } = await req.json();
    if (typeof partId !== "number" || typeof token !== "string" || !data || typeof data !== "object") {
      return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
    }
    const safe: PartData = {
      notes: Array.isArray(data.notes) ? data.notes.slice(0, 128) : [],
      drums: Array.isArray(data.drums) ? data.drums.slice(0, 128) : [],
    };
    const res = await submitPart(partId, token, safe, typeof email === "string" ? email : null);
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
