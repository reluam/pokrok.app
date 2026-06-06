import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lang";
const ADMIN_COOKIE = "admin_token";

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

export async function middleware(request: NextRequest) {
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

  // ── Smazané experimenty → 410 Gone ─────────────────────────────
  if (!pathname.startsWith("/admin")) {
    const gone = await getGone(request);
    if (gone.has(pathname)) {
      return new NextResponse("410 Gone — this experiment no longer exists.", {
        status: 410,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
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
  // Běží na všech stránkách kromě API, _next a statických souborů (kvůli 410 kontrole) + admin.
  matcher: ["/((?!api/|_next/|favicon.ico|logo.svg|.*\\.).*)", "/admin/:path*"],
};
