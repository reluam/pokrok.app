import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add Czech domain(s) here when configured, e.g. "cesta.matejmauler.com"
const CS_DOMAINS: string[] = [];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const lang = CS_DOMAINS.some((d) => host === d || host.startsWith(d + ":")) ? "cs" : "en";

  const response = NextResponse.next();
  response.headers.set("x-lang", lang);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
