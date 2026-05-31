import { NextRequest, NextResponse } from "next/server";
import { castMusicVote } from "@/lib/musicServer";
import crypto from "crypto";

function ipHash(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip + "music").digest("hex").slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const { roundId, optionId } = await req.json();
    if (typeof roundId !== "number" || typeof optionId !== "string") {
      return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
    }
    const res = await castMusicVote(roundId, optionId, ipHash(req));
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
