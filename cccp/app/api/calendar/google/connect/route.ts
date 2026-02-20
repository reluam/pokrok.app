import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const missing: string[] = [];
  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!baseUrl) missing.push("NEXT_PUBLIC_APP_URL");
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Google Calendar is not configured",
        missing_env: missing,
        hint: "Add these to .env.local and restart the dev server. See .env.example for values.",
      },
      { status: 500 }
    );
  }

  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/calendar/google/callback`;
  const state = Buffer.from(userId, "utf-8").toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
