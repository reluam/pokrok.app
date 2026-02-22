import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/database";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const adminUrl = new URL("/admin", baseUrl);

  if (error) {
    adminUrl.searchParams.set("google", "denied");
    return NextResponse.redirect(adminUrl.toString());
  }

  if (!code?.trim()) {
    adminUrl.searchParams.set("google", "no_code");
    return NextResponse.redirect(adminUrl.toString());
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!savedState || state !== savedState) {
    adminUrl.searchParams.set("google", "invalid_state");
    return NextResponse.redirect(adminUrl.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId?.trim() || !clientSecret?.trim() || !redirectUri?.trim()) {
    adminUrl.searchParams.set("google", "missing_env");
    return NextResponse.redirect(adminUrl.toString());
  }

  try {
    const body = new URLSearchParams({
      code: code.trim(),
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      redirect_uri: redirectUri.trim(),
      grant_type: "authorization_code",
    });
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.warn("[google-auth] token exchange failed:", tokenRes.status, t);
      adminUrl.searchParams.set("google", "exchange_failed");
      return NextResponse.redirect(adminUrl.toString());
    }
    const data = (await tokenRes.json()) as { refresh_token?: string };
    const refreshToken = data.refresh_token?.trim();
    if (!refreshToken) {
      adminUrl.searchParams.set("google", "no_refresh_token");
      return NextResponse.redirect(adminUrl.toString());
    }

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
      await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS google_refresh_token TEXT`;
    } catch { /* ignore */ }

    const existing = await sql`SELECT id FROM admin_settings LIMIT 1` as { id: number }[];
    if (existing.length > 0) {
      await sql`
        UPDATE admin_settings SET google_refresh_token = ${refreshToken}, updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO admin_settings (google_refresh_token, updated_at)
        VALUES (${refreshToken}, NOW())
      `;
    }

    adminUrl.searchParams.set("google", "connected");
    return NextResponse.redirect(adminUrl.toString());
  } catch (err) {
    console.error("[google-auth] callback error:", err);
    adminUrl.searchParams.set("google", "error");
    return NextResponse.redirect(adminUrl.toString());
  }
}
