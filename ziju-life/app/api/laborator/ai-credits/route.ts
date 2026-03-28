import { NextRequest, NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { getLaboratorUser } from "@/lib/laborator-user";
import { getAICreditsBalance } from "@/lib/ai-credits";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getLaboratorUser(request);
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

  const valid = await checkLaboratorAccess(user.email);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const balance = await getAICreditsBalance(user.id);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("GET /api/laborator/ai-credits error:", error);
    return NextResponse.json({ error: "Nepodařilo se načíst kredity." }, { status: 500 });
  }
}
