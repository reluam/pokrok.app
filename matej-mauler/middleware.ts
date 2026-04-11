import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lang";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only act on root path. /en is explicit and always renders English.
  if (pathname !== "/") return NextResponse.next();

  // Respect explicit user choice
  const cookieLang = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLang === "en") {
    return NextResponse.redirect(new URL("/en", request.url));
  }
  if (cookieLang === "cs") {
    return NextResponse.next();
  }

  // No preference yet — fall back to geo detection (Vercel sets this header)
  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "";

  if (country && country !== "CZ" && country !== "SK") {
    return NextResponse.redirect(new URL("/en", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
