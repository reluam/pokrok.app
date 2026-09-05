import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ACCOUNTS_ENABLED } from "./lib/features";
import { langFromQuery } from "./lib/getLang";
import { DRAFT_PATHS, showDrafts } from "./lib/drafts";

const ADMIN_COOKIE = "admin_token";

// Clerk běží jen se zapnutými účty a klíčem → jinak čistý handler (web nespadne na 500).
const clerkEnabled = ACCOUNTS_ENABLED && !!process.env.CLERK_SECRET_KEY;

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

  // ── ?lang= → cookie ───────────────────────────────────────────
  // Jediné místo, kde se jazyk mění. Bez redirectu, aby sdílený odkaz zůstal,
  // jak byl poslán, a aby to fungovalo na každé routě naráz (stránky samy
  // o ?lang= nevědí, čtou jen cookie přes getLang()).
  const wanted = langFromQuery(request.nextUrl.searchParams.get("lang"));
  if (wanted) {
    const res = NextResponse.next();
    res.cookies.set("lang", wanted, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      // ne httpOnly: přepínač a 404 si jazyk čtou i na klientovi
    });
    return res;
  }

  // ── Admin protection ────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const secret = process.env.ADMIN_SECRET;
    if (!secret || token !== secret) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Drafty → 404 už tady ───────────────────────────────────────
  // guardExperiment() ve stránce sice notFound() zavolá, ale odpověď se
  // streamuje: odchází se stavem 200 a s <title> draftu z generateMetadata.
  // Pro vyhledávače je to indexovatelná stránka. Tady je to skutečná 404
  // a nic z nezveřejněného experimentu neuteče.
  if (!showDrafts() && DRAFT_PATHS.has(pathname)) {
    return new NextResponse("404", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
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
