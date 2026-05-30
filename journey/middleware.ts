import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add Czech domain(s) here when configured, e.g. "cesta.matejmauler.com"
const CS_DOMAINS: string[] = [];

export function middleware(request: NextRequest) {
  const cookieLang = request.cookies.get("lang")?.value;
  const host = request.headers.get("host") ?? "";

  const lang =
    cookieLang === "cs" || cookieLang === "en"
      ? cookieLang
      : CS_DOMAINS.some((d) => host === d || host.startsWith(d + ":"))
        ? "cs"
        : "en";

  // Pass lang to server components via a request header
  const headers = new Headers(request.headers);
  headers.set("x-lang", lang);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
