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
      notion_api_key: string | null; notion_database_id: string | null; cal_link: string | null; booking_embed_url?: string | null;
      clickup_list_id?: string | null; google_calendar_id?: string | null; google_refresh_token?: string | null;
      clickup_field_mail?: string | null; clickup_field_zdroj?: string | null; clickup_field_jmeno?: string | null;
      clickup_field_status?: string | null; clickup_status_reach_out?: string | null; clickup_status_meeting?: string | null;
    };
    let result: Row[];
    try {
      result = await sql`SELECT notion_api_key, notion_database_id, cal_link, booking_embed_url, clickup_list_id, google_calendar_id, google_refresh_token, clickup_field_mail, clickup_field_zdroj, clickup_field_jmeno, clickup_field_status, clickup_status_reach_out, clickup_status_meeting FROM admin_settings LIMIT 1` as Row[];
    } catch {
      result = await sql`SELECT notion_api_key, notion_database_id, cal_link, booking_embed_url, clickup_list_id, google_calendar_id, google_refresh_token FROM admin_settings LIMIT 1` as Row[];
    }

    if (result.length > 0) {
      const row = result[0];
      return NextResponse.json({
        notionApiKey: row.notion_api_key || process.env.NOTION_API_KEY || "",
        notionDatabaseId: row.notion_database_id || process.env.NOTION_DATABASE_ID || "",
        calLink: row.cal_link || process.env.NEXT_PUBLIC_CAL_LINK || "",
        bookingEmbedUrl: row.booking_embed_url ?? process.env.NEXT_PUBLIC_BOOKING_EMBED_URL ?? "",
        clickupListId: row.clickup_list_id ?? process.env.CLICKUP_LIST_ID ?? "",
        clickupFieldMail: row.clickup_field_mail ?? "",
        clickupFieldZdroj: row.clickup_field_zdroj ?? "",
        clickupFieldJmeno: row.clickup_field_jmeno ?? "",
        clickupFieldStatus: row.clickup_field_status ?? "",
        clickupStatusReachOut: row.clickup_status_reach_out ?? "",
        clickupStatusMeeting: row.clickup_status_meeting ?? "",
        googleCalendarId: row.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? "primary",
        googleCalendarConnected: Boolean(row?.google_refresh_token?.trim()),
      });
    }

    return NextResponse.json({
      notionApiKey: process.env.NOTION_API_KEY ? "••••••••••••••••" : "",
      notionDatabaseId: process.env.NOTION_DATABASE_ID ? "••••••••••••••••" : "",
      calLink: process.env.NEXT_PUBLIC_CAL_LINK || "",
      bookingEmbedUrl: process.env.NEXT_PUBLIC_BOOKING_EMBED_URL || "",
      clickupListId: process.env.CLICKUP_LIST_ID ?? "",
      clickupFieldMail: "",
      clickupFieldZdroj: "",
      clickupFieldJmeno: "",
      clickupFieldStatus: "",
      clickupStatusReachOut: "",
      clickupStatusMeeting: "",
      googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
      googleCalendarConnected: Boolean(process.env.GOOGLE_REFRESH_TOKEN?.trim()),
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
      notionApiKey, notionDatabaseId, calLink, bookingEmbedUrl, clickupListId, googleCalendarId,
      clickupFieldMail, clickupFieldZdroj, clickupFieldJmeno, clickupFieldStatus, clickupStatusReachOut, clickupStatusMeeting,
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
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS booking_embed_url TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_list_id TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS google_calendar_id TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS google_refresh_token TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_field_mail TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_field_zdroj TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_field_jmeno TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_field_status TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_status_reach_out TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS clickup_status_meeting TEXT`; } catch { /* already exists */ }

    const existing = await sql`SELECT id FROM admin_settings LIMIT 1`;
    if (existing.length > 0) {
      await sql`
        UPDATE admin_settings SET
          notion_api_key = ${notionApiKey ?? null},
          notion_database_id = ${notionDatabaseId ?? null},
          cal_link = ${calLink ?? null},
          booking_embed_url = ${bookingEmbedUrl?.trim() || null},
          clickup_list_id = ${clickupListId?.trim() || null},
          google_calendar_id = ${googleCalendarId?.trim() || null},
          clickup_field_mail = ${clickupFieldMail?.trim() || null},
          clickup_field_zdroj = ${clickupFieldZdroj?.trim() || null},
          clickup_field_jmeno = ${clickupFieldJmeno?.trim() || null},
          clickup_field_status = ${clickupFieldStatus?.trim() || null},
          clickup_status_reach_out = ${clickupStatusReachOut?.trim() || null},
          clickup_status_meeting = ${clickupStatusMeeting?.trim() || null},
          updated_at = NOW()
        WHERE id = ${(existing[0] as { id: number }).id}
      `;
    } else {
      await sql`
        INSERT INTO admin_settings (notion_api_key, notion_database_id, cal_link, booking_embed_url, clickup_list_id, google_calendar_id, clickup_field_mail, clickup_field_zdroj, clickup_field_jmeno, clickup_field_status, clickup_status_reach_out, clickup_status_meeting, updated_at)
        VALUES (${notionApiKey ?? null}, ${notionDatabaseId ?? null}, ${calLink ?? null}, ${bookingEmbedUrl?.trim() || null}, ${clickupListId?.trim() || null}, ${googleCalendarId?.trim() || null}, ${clickupFieldMail?.trim() || null}, ${clickupFieldZdroj?.trim() || null}, ${clickupFieldJmeno?.trim() || null}, ${clickupFieldStatus?.trim() || null}, ${clickupStatusReachOut?.trim() || null}, ${clickupStatusMeeting?.trim() || null}, NOW())
      `;
    }

    // Poznámka: V produkci bys měl tyto hodnoty nastavit jako env proměnné na Vercelu
    // Tato DB slouží jen jako UI pro správu, skutečné hodnoty se berou z .env
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit nastavení." },
      { status: 500 }
    );
  }
}
