import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRatings, setRating } from "@/lib/ratingsDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page");
    if (!page) return NextResponse.json({ error: "missing page" }, { status: 400 });
    const { userId } = await auth();
    const summary = await getRatings(page, userId ?? undefined);
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const page = typeof b?.page === "string" ? b.page : "";
    const value = Number(b?.value);
    if (!page) return NextResponse.json({ error: "missing page" }, { status: 400 });

    const res = await setRating(page, userId, value);
    if ("error" in res) return NextResponse.json(res, { status: 400 });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
