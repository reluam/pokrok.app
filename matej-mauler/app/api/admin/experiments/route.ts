import { NextRequest, NextResponse } from "next/server";
import { getAllExperiments, createExperiment, uniqueSlug, type Stage } from "@/lib/experimentsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getAllExperiments()); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

// Vytvoří kartu. Nápad stačí s titulem (slug se odvodí, href může chybět); draft/publish potřebuje href.
export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const stage: Stage = b.stage === "published" || b.stage === "draft" ? b.stage : "idea";
    const titleCs = String(b.title_cs || "").trim();
    const titleEn = String(b.title_en || "").trim();
    const explicit = String(b.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (stage !== "idea" && !b.href) return NextResponse.json({ error: "href is required for draft/publish" }, { status: 400 });
    if (!explicit && !titleCs && !titleEn) return NextResponse.json({ error: "title is required" }, { status: 400 });
    const slug = explicit || await uniqueSlug(titleCs || titleEn);
    await createExperiment({
      slug,
      title_cs: titleCs || titleEn || slug, title_en: titleEn || titleCs || slug,
      desc_cs: b.desc_cs || "", desc_en: b.desc_en || "",
      color: b.color || "#EDE9FE", href: b.href || "", external: !!b.external,
      stage,
    });
    return NextResponse.json({ ok: true, slug });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
