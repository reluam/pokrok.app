import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "admin_token";

// Clerk běží jen s klíčem → bez něj se použije čistý handler (web nespadne na 500 před setupem).
const clerkEnabled = !!process.env.CLERK_SECRET_KEY;

// Cache hrefů smazaných experimentů (per edge isolate, TTL 60 s) → 410 Gone bez DB v hot-path.
let goneCache: { ts: number; set: Set<string> } = { ts: 0, set: new Set() };
async function getGone(request: NextRequest): Promise<Set<string>> {
  const now = Date.now();
  if (now - goneCache.ts < 60_000) return goneCache.set;
  try {
    const res = await fetch(new URL("/api/gone", request.url), { headers: { "x-mw": "1" } });
    const data = (await res.json()) as { hrefs?: string[] };
    goneCache = { ts: now, set: new Set(data.hrefs ?? []) };
  } catch {
    goneCache = { ts: now, set: goneCache.set };
  }
  return goneCache.set;
}

async function handle(request: NextRequest) {
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

  // ── Smazané experimenty → 410 Gone (jen stránky, ne API) ───────
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const gone = await getGone(request);
    if (gone.has(pathname)) {
      return new NextResponse("410 Gone — this experiment no longer exists.", {
        status: 410,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  }

  // Web je proteď pouze v angličtině — žádné jazykové routování.
  return NextResponse.next();
}

// Clerk obaluje handler jen kvůli auth() v /api/comments; bez klíče čistý handler.
export default clerkEnabled
  ? clerkMiddleware((_auth, request) => handle(request))
  : (request: NextRequest) => handle(request);

export const config = {
  matcher: [
    // Stránky (kvůli 410 kontrole) + admin + comments API (Clerk auth()) + Clerk auto-proxy.
    "/((?!api/|_next/|favicon.ico|logo.svg|.*\\.).*)",
    "/admin/:path*",
    "/api/comments/:path*",
    "/api/ratings/:path*",
    "/api/participation/:path*",
    "/__clerk/:path*",
  ],
};
