import { NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const settingsUrl = `${baseUrl.replace(/\/$/, "")}/settings/calendar`;

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?error=missing_code`);
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf-8");
  } catch {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/calendar/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?error=server_config`);
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Google token exchange failed:", err);
    return NextResponse.redirect(`${settingsUrl}?error=token_exchange`);
  }

  const data = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  const id = crypto.randomUUID();

  await sql`
    INSERT INTO calendar_connections (id, user_id, provider, access_token, refresh_token, expires_at, updated_at)
    VALUES (${id}, ${userId}, 'google', ${data.access_token}, ${data.refresh_token ?? null}, ${expiresAt}, NOW())
    ON CONFLICT (user_id, provider) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, calendar_connections.refresh_token),
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;

  const existingCal = await sql`
    SELECT 1 FROM user_calendars WHERE user_id = ${userId} AND provider = 'google' LIMIT 1
  `;
  if (!existingCal.length) {
    await sql`
      INSERT INTO user_calendars (id, user_id, provider, calendar_id, label, is_primary)
      VALUES (${crypto.randomUUID()}, ${userId}, 'google', 'primary', 'Primary', true)
    `;
  }

  return NextResponse.redirect(`${settingsUrl}?connected=1`);
}
