import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lang";
const ADMIN_COOKIE = "admin_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin protection ────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const secret = process.env.ADMIN_SECRET;
    if (!secret || token !== secret) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Language routing (root only) ───────────────────────────────
  if (pathname !== "/") return NextResponse.next();

  const cookieLang = request.cookies.get(COOKIE_NAME)?.value;

  if (cookieLang === "cs") {
    return NextResponse.redirect(new URL("/cs", request.url));
  }
  if (cookieLang === "en") {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  if (host.endsWith(".cz")) {
    return NextResponse.redirect(new URL("/cs", request.url));
  }

  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "";
  if (country === "CZ" || country === "SK") {
    return NextResponse.redirect(new URL("/cs", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
