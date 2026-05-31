import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lang";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/") return NextResponse.next();

  const cookieLang = request.cookies.get(COOKIE_NAME)?.value;

  // Explicit cookie preference
  if (cookieLang === "cs") {
    return NextResponse.redirect(new URL("/cs", request.url));
  }
  if (cookieLang === "en") {
    return NextResponse.next();
  }

  // Czech domain → Czech version
  const host = request.headers.get("host") ?? "";
  if (host.endsWith(".cz")) {
    return NextResponse.redirect(new URL("/cs", request.url));
  }

  // CZ/SK geo without explicit preference → Czech
  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "";
  if (country === "CZ" || country === "SK") {
    return NextResponse.redirect(new URL("/cs", request.url));
  }

  // Default: English at /
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
