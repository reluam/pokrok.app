import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId?.trim() || !redirectUri?.trim()) {
    return NextResponse.redirect(new URL("/admin?google=missing_env", request.url));
  }

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId.trim());
  url.searchParams.set("redirect_uri", redirectUri.trim());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", CALENDAR_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent"); // force refresh_token
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
