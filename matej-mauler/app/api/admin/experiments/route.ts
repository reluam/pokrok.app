import { NextRequest, NextResponse } from "next/server";
import { getAllExperiments, createExperiment } from "@/lib/experimentsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getAllExperiments()); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const slug = String(b.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug || !b.href) return NextResponse.json({ error: "slug a href povinné" }, { status: 400 });
    await createExperiment({
      slug,
      title_cs: b.title_cs || slug, title_en: b.title_en || slug,
      desc_cs: b.desc_cs || "", desc_en: b.desc_en || "",
      color: b.color || "#EDE9FE", href: b.href, external: !!b.external,
      published: false,
    });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
