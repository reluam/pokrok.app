import { NextRequest, NextResponse } from "next/server";
import { nextCount, getCount } from "@/lib/counterDb";

export const dynamic = "force-dynamic";

const COOKIE = "visitor_no";

// Globální počítadlo návštěvníků (sdílené napříč experiences). Prohlížeč si své číslo
// pamatuje přes cookie → vrací stejné číslo, nezvyšuje. Nový prohlížeč = +1.
export async function GET(req: NextRequest) {
  try {
    const existing = req.cookies.get(COOKIE)?.value;
    const n = existing ? parseInt(existing, 10) : NaN;
    if (Number.isFinite(n) && n > 0) {
      const total = await getCount("visitors").catch(() => n);
      return NextResponse.json({ no: n, total });
    }
    const no = await nextCount("visitors");
    const res = NextResponse.json({ no, total: no });
    res.cookies.set(COOKIE, String(no), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 5,
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ no: null, total: null });
  }
}
