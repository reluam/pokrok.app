import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";
import type { Lead } from "@/lib/leads-db";

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await sql`
      SELECT 
        id,
        email,
        name,
        source,
        status,
        message,
        utm_source,
        utm_medium,
        utm_campaign,
        created_at::text as "createdAt",
        updated_at::text as "updatedAt"
      FROM leads
      ORDER BY created_at DESC
    ` as Lead[];

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("GET /api/admin/leads error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst leady." },
      { status: 500 }
    );
  }
}
