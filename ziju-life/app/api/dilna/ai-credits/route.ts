import { NextRequest, NextResponse } from "next/server";
import { checkDilnaAccess } from "@/lib/dilna-auth";
import { getDilnaUser } from "@/lib/dilna-user";
import { getAICreditsBalance } from "@/lib/ai-credits";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getDilnaUser(request);
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

  const valid = await checkDilnaAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const balance = await getAICreditsBalance(user.id);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("GET /api/dilna/ai-credits error:", error);
    return NextResponse.json({ error: "Nepodařilo se načíst kredity." }, { status: 500 });
  }
}
