import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";
import type { LeadStatus } from "@/lib/leads-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !["novy", "kontaktovan", "rezervovano", "odmitnuto"].includes(status)) {
      return NextResponse.json(
        { error: "Neplatný stav." },
        { status: 400 }
      );
    }

    await sql`
      UPDATE leads
      SET status = ${status as LeadStatus}, updated_at = NOW()
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/leads/[id] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se aktualizovat lead." },
      { status: 500 }
    );
  }
}
