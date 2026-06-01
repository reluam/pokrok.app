import { NextRequest, NextResponse } from "next/server";
import { assignPart } from "@/lib/musicServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (typeof token !== "string" || token.length < 6) {
      return NextResponse.json({ error: "Neplatný token." }, { status: 400 });
    }
    const assignment = await assignPart(token);
    return NextResponse.json(assignment);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
