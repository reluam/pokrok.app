import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Zkus najít settings v DB
    const result = await sql`
      SELECT notion_api_key, notion_database_id, cal_link
      FROM admin_settings
      LIMIT 1
    `;

    if (result.length > 0) {
      return NextResponse.json({
        notionApiKey: result[0].notion_api_key || process.env.NOTION_API_KEY || "",
        notionDatabaseId: result[0].notion_database_id || process.env.NOTION_DATABASE_ID || "",
        calLink: result[0].cal_link || process.env.NEXT_PUBLIC_CAL_LINK || "",
      });
    }

    // Pokud není v DB, vrať z .env (maskované)
    return NextResponse.json({
      notionApiKey: process.env.NOTION_API_KEY ? "••••••••••••••••" : "",
      notionDatabaseId: process.env.NOTION_DATABASE_ID ? "••••••••••••••••" : "",
      calLink: process.env.NEXT_PUBLIC_CAL_LINK || "",
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
    const { notionApiKey, notionDatabaseId, calLink } = body;

    // Vytvoř tabulku pokud neexistuje
    await sql`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        notion_api_key TEXT,
        notion_database_id TEXT,
        cal_link TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Upsert settings - vždy aktualizuj první řádek nebo vytvoř nový
    const existing = await sql`SELECT id FROM admin_settings LIMIT 1`;
    if (existing.length > 0) {
      await sql`
        UPDATE admin_settings SET
          notion_api_key = ${notionApiKey || null},
          notion_database_id = ${notionDatabaseId || null},
          cal_link = ${calLink || null},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO admin_settings (notion_api_key, notion_database_id, cal_link, updated_at)
        VALUES (${notionApiKey || null}, ${notionDatabaseId || null}, ${calLink || null}, NOW())
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
