import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

type MeetingType = {
  id: string;
  label: string;
  description?: string;
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
  defaultDurationMinutes?: number;
  priceId?: string;
};

export async function GET() {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = (await sql`
      SELECT booking_meeting_types
      FROM admin_settings
      LIMIT 1
    `) as { booking_meeting_types: string | null }[];
    const raw = rows[0]?.booking_meeting_types;
    let meetingTypes: MeetingType[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          meetingTypes = parsed as MeetingType[];
        }
      } catch {
        meetingTypes = [];
      }
    }
    return NextResponse.json({ meetingTypes });
  } catch (err) {
    console.error("GET /api/admin/booking-meeting-types error:", err);
    return NextResponse.json(
      { error: "Chyba načtení typů schůzek." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = Array.isArray(body.meetingTypes) ? body.meetingTypes : [];
    const cleaned: MeetingType[] = [];
    for (const item of input) {
      if (!item || typeof item !== "object") continue;
      const id = String((item as any).id ?? "").trim();
      const label = String((item as any).label ?? "").trim();
      if (!id || !label) continue;
      const mt: MeetingType = {
        id,
        label,
        description:
          typeof (item as any).description === "string"
            ? (item as any).description
            : undefined,
        isPaid: Boolean((item as any).isPaid),
      };
      const startDateRaw = (item as any).startDate;
      const endDateRaw = (item as any).endDate;
      if (typeof startDateRaw === "string" && startDateRaw.length >= 10) {
        mt.startDate = startDateRaw.slice(0, 10);
      }
      if (typeof endDateRaw === "string" && endDateRaw.length >= 10) {
        mt.endDate = endDateRaw.slice(0, 10);
      }
      const defDur = Number((item as any).defaultDurationMinutes);
      if (!Number.isNaN(defDur) && defDur > 0) {
        mt.defaultDurationMinutes = defDur;
      }
      const priceIdRaw = (item as any).priceId;
      if (typeof priceIdRaw === "string" && priceIdRaw.trim()) {
        mt.priceId = priceIdRaw.trim();
      }
      cleaned.push(mt);
    }

    // ensure table / column exists
    await sql`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        notion_api_key TEXT,
        notion_database_id TEXT,
        cal_link TEXT,
        booking_embed_url TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    try {
      await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS booking_meeting_types TEXT`;
    } catch {
      // ignore
    }

    const existing = await sql`SELECT id FROM admin_settings LIMIT 1`;
    if (existing.length > 0) {
      await sql`
        UPDATE admin_settings
        SET booking_meeting_types = ${cleaned.length > 0 ? JSON.stringify(cleaned) : null},
            updated_at = NOW()
        WHERE id = ${(existing[0] as { id: number }).id}
      `;
    } else {
      await sql`
        INSERT INTO admin_settings (
          booking_meeting_types,
          updated_at
        )
        VALUES (
          ${cleaned.length > 0 ? JSON.stringify(cleaned) : null},
          NOW()
        )
      `;
    }

    return NextResponse.json({ success: true, meetingTypes: cleaned });
  } catch (err) {
    console.error("POST /api/admin/booking-meeting-types error:", err);
    return NextResponse.json(
      { error: "Chyba ukládání typů schůzek." },
      { status: 500 }
    );
  }
}

