import { NextRequest, NextResponse } from "next/server";
import { verifyUserSession } from "@/lib/user-auth";
import { sql } from "@/lib/database";

export async function POST(req: NextRequest) {
  const user = await verifyUserSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { purchaseId } = await req.json();
    if (!purchaseId) return NextResponse.json({ error: "missing purchaseId" }, { status: 400 });
    await sql`
      UPDATE purchases
      SET completed_at = NOW()
      WHERE id = ${purchaseId}
        AND user_id = ${user.id}
        AND completed_at IS NULL
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[journey-complete] error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
