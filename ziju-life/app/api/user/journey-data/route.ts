import { NextRequest, NextResponse } from "next/server";
import { verifyUserSession } from "@/lib/user-auth";
import { sql } from "@/lib/database";

export async function GET(req: NextRequest) {
  const user = await verifyUserSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const purchaseId = req.nextUrl.searchParams.get("purchaseId");
  if (!purchaseId) return NextResponse.json({ error: "missing purchaseId" }, { status: 400 });

  const rows = await sql`
    SELECT journey_data
    FROM purchases
    WHERE id = ${purchaseId} AND user_id = ${user.id}
    LIMIT 1
  `;
  const data = (rows[0] as { journey_data: unknown } | undefined)?.journey_data ?? null;
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const user = await verifyUserSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { purchaseId, ...data } = await req.json();
    if (!purchaseId) return NextResponse.json({ error: "missing purchaseId" }, { status: 400 });
    await sql`
      UPDATE purchases
      SET journey_data = ${JSON.stringify(data)}::jsonb
      WHERE id = ${purchaseId}
        AND user_id = ${user.id}
        AND completed_at IS NULL
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[journey-data] save error:", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
