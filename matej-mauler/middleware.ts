import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lang";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/") return NextResponse.next();

  const cookieLang = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLang === "en") {
    return NextResponse.redirect(new URL("/en", request.url));
  }
  if (cookieLang === "cs") {
    return NextResponse.next();
  }

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
