import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getAllTools, createTool } from "@/lib/toolbox-db";

export async function GET(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeInactive =
    request.nextUrl.searchParams.get("includeInactive") === "true";

  try {
    const tools = await getAllTools({ includeInactive });
    return NextResponse.json({ tools });
  } catch (error) {
    console.error("GET /api/admin/toolbox error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst nástroje." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "").trim();
    const shortDescription = String(body.shortDescription ?? "").trim();
    const descriptionMarkdown = String(body.descriptionMarkdown ?? "").trim();
    const applicationMarkdown = String(body.applicationMarkdown ?? "").trim();

    if (!title || !slug || !shortDescription) {
      return NextResponse.json(
        { error: "Vyplň název, slug i krátký popis." },
        { status: 400 }
      );
    }

    const tool = await createTool({
      title,
      slug,
      shortDescription,
      descriptionMarkdown: descriptionMarkdown || shortDescription,
      applicationMarkdown: applicationMarkdown || "",
      sources: Array.isArray(body.sources) ? body.sources : [],
      tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t)) : [],
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : undefined,
      difficulty: typeof body.difficulty === "number" && body.difficulty >= 1 && body.difficulty <= 3 ? body.difficulty : undefined,
      durationEstimate: typeof body.durationEstimate === "string" && body.durationEstimate.trim() ? body.durationEstimate.trim() : undefined,
      icon: typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : undefined,
      orderIndex: typeof body.orderIndex === "number" ? body.orderIndex : Number(body.orderIndex ?? 0) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
      relatedToolIds: Array.isArray(body.relatedToolIds)
        ? body.relatedToolIds.map((id: unknown) => String(id))
        : undefined,
    });

    return NextResponse.json({ tool });
  } catch (error) {
    console.error("POST /api/admin/toolbox error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit nástroj." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Chybí ID nástroje." },
        { status: 400 }
      );
    }

    const { updateTool } = await import("@/lib/toolbox-db");

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.slug === "string") updates.slug = body.slug.trim();
    if (typeof body.shortDescription === "string") updates.shortDescription = body.shortDescription.trim();
    if (typeof body.descriptionMarkdown === "string") updates.descriptionMarkdown = body.descriptionMarkdown;
    if (typeof body.applicationMarkdown === "string") updates.applicationMarkdown = body.applicationMarkdown;
    if (body.sources !== undefined) updates.sources = Array.isArray(body.sources) ? body.sources : [];
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t)) : [];
    if (body.category !== undefined) updates.category = typeof body.category === "string" ? body.category.trim() || null : null;
    if (body.difficulty !== undefined) updates.difficulty = typeof body.difficulty === "number" ? body.difficulty : null;
    if (body.durationEstimate !== undefined) updates.durationEstimate = typeof body.durationEstimate === "string" ? body.durationEstimate.trim() || null : null;
    if (body.icon !== undefined) updates.icon = typeof body.icon === "string" ? body.icon.trim() || null : null;
    if (body.orderIndex !== undefined) {
      const n = typeof body.orderIndex === "number" ? body.orderIndex : Number(body.orderIndex);
      if (!Number.isNaN(n)) updates.orderIndex = n;
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.isFeatured !== undefined) updates.isFeatured = Boolean(body.isFeatured);
    if (body.relatedToolIds !== undefined) {
      updates.relatedToolIds = Array.isArray(body.relatedToolIds)
        ? body.relatedToolIds.map((id: unknown) => String(id))
        : [];
    }

    const tool = await updateTool(id, updates);
    if (!tool) {
      return NextResponse.json(
        { error: "Nástroj nebyl nalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ tool });
  } catch (error) {
    console.error("PUT /api/admin/toolbox error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se upravit nástroj." },
      { status: 500 }
    );
  }
}
