import { NextRequest, NextResponse } from "next/server";
import { voteOption } from "@/lib/radioServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function ipHash(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip + "radio").digest("hex").slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const { round, option } = await req.json();
    if (typeof round !== "number" || typeof option !== "string" || option.length > 20) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    return NextResponse.json(await voteOption(round, option, ipHash(req)));
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
