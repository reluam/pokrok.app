import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    type Row = {
      cal_link: string | null;
      google_calendar_id?: string | null;
      google_refresh_token?: string | null;
      show_principles?: boolean | null;
      booking_meeting_types?: string | null;
    };
    const result = await sql`
      SELECT
        cal_link,
        google_calendar_id,
        google_refresh_token,
        show_principles,
        booking_meeting_types
      FROM admin_settings
      LIMIT 1
    ` as Row[];

    if (result.length > 0) {
      const row = result[0];
      let bookingMeetingTypes: unknown = [];
      if (row.booking_meeting_types) {
        try {
          bookingMeetingTypes = JSON.parse(row.booking_meeting_types);
        } catch {
          bookingMeetingTypes = [];
        }
      }
      return NextResponse.json({
        calLink: row.cal_link || process.env.NEXT_PUBLIC_CAL_LINK || "",
        googleCalendarId: row.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? "primary",
        googleCalendarConnected: Boolean(row?.google_refresh_token?.trim()),
        showPrinciples: row.show_principles ?? true,
        bookingMeetingTypes,
      });
    }

    return NextResponse.json({
      calLink: process.env.NEXT_PUBLIC_CAL_LINK || "",
      googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
      googleCalendarConnected: Boolean(process.env.GOOGLE_REFRESH_TOKEN?.trim()),
      showPrinciples: true,
      bookingMeetingTypes: [],
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst nastavení." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      calLink,
      googleCalendarId,
      showPrinciples,
      bookingMeetingTypes,
    } = body;

    // Vytvoř tabulku pokud neexistuje
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
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS google_calendar_id TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS google_refresh_token TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS show_principles BOOLEAN`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS booking_meeting_types TEXT`; } catch { /* already exists */ }

    const existing = await sql`SELECT id FROM admin_settings LIMIT 1`;
    if (existing.length > 0) {
      await sql`
        UPDATE admin_settings SET
          cal_link = ${calLink ?? null},
          google_calendar_id = ${googleCalendarId?.trim() || null},
          show_principles = ${typeof showPrinciples === "boolean" ? showPrinciples : null},
          booking_meeting_types = ${Array.isArray(bookingMeetingTypes) ? JSON.stringify(bookingMeetingTypes) : null},
          updated_at = NOW()
        WHERE id = ${(existing[0] as { id: number }).id}
      `;
    } else {
      await sql`
        INSERT INTO admin_settings (
          cal_link,
          google_calendar_id,
          show_principles,
          booking_meeting_types,
          updated_at
        )
        VALUES (
          ${calLink ?? null},
          ${googleCalendarId?.trim() || null},
          ${typeof showPrinciples === "boolean" ? showPrinciples : null},
          ${Array.isArray(bookingMeetingTypes) ? JSON.stringify(bookingMeetingTypes) : null},
          NOW()
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit nastavení." },
      { status: 500 }
    );
  }
}
