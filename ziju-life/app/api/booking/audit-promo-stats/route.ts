import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export const dynamic = "force-dynamic";

const PROMO_TOTAL = 20;
const AUDIT_MEETING_TYPE_ID = "coaching_paid";

export async function GET() {
  try {
    const rows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM bookings
      WHERE meeting_type = ${AUDIT_MEETING_TYPE_ID}
    `) as { count: number }[];

    const used = rows[0]?.count ?? 0;
    const remaining = Math.max(0, PROMO_TOTAL - used);

    return NextResponse.json({
      total: PROMO_TOTAL,
      used,
      remaining,
    });
  } catch (err) {
    console.error("GET /api/booking/audit-promo-stats error:", err);
    return NextResponse.json(
      {
        total: PROMO_TOTAL,
        used: 0,
        remaining: PROMO_TOTAL,
      },
      { status: 200 }
    );
  }
}

