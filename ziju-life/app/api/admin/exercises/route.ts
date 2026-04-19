import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getAllExercises,
  createExercise,
  updateExercise,
} from "@/lib/exercises";

export async function GET(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeInactive =
    request.nextUrl.searchParams.get("includeInactive") === "true";

  try {
    const exercises = await getAllExercises({ includeInactive });
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("GET /api/admin/exercises error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst cvičení." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "").trim();
    const bodyMarkdown = String(body.bodyMarkdown ?? "").trim();

    if (!title || !slug || !bodyMarkdown) {
      return NextResponse.json(
        { error: "Vyplň název, slug i text cvičení." },
        { status: 400 }
      );
    }

    const exercise = await createExercise({
      title,
      slug,
      emoji:
        typeof body.emoji === "string" && body.emoji.trim().length > 0
          ? body.emoji.trim()
          : null,
      bodyMarkdown,
      orderIndex:
        typeof body.orderIndex === "number"
          ? body.orderIndex
          : Number(body.orderIndex ?? 0) || 0,
      resourceUrl:
        typeof body.resourceUrl === "string" && body.resourceUrl.trim().length > 0
          ? body.resourceUrl.trim()
          : null,
      relatedPostSlug:
        typeof body.relatedPostSlug === "string" &&
        body.relatedPostSlug.trim().length > 0
          ? body.relatedPostSlug.trim()
          : null,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error("POST /api/admin/exercises error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit cvičení." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Chybí ID cvičení." }, { status: 400 });
    }

    const updates: Parameters<typeof updateExercise>[1] = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.slug === "string") updates.slug = body.slug.trim();
    if (typeof body.emoji === "string")
      updates.emoji = body.emoji.trim() || null;
    if (typeof body.bodyMarkdown === "string")
      updates.bodyMarkdown = body.bodyMarkdown;
    if (body.orderIndex !== undefined) {
      const n =
        typeof body.orderIndex === "number"
          ? body.orderIndex
          : Number(body.orderIndex);
      if (!Number.isNaN(n)) updates.orderIndex = n;
    }
    if (body.resourceUrl !== undefined) {
      updates.resourceUrl =
        typeof body.resourceUrl === "string" &&
        body.resourceUrl.trim().length > 0
          ? body.resourceUrl.trim()
          : null;
    }
    if (body.relatedPostSlug !== undefined) {
      updates.relatedPostSlug =
        typeof body.relatedPostSlug === "string" &&
        body.relatedPostSlug.trim().length > 0
          ? body.relatedPostSlug.trim()
          : null;
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    const exercise = await updateExercise(id, updates);
    if (!exercise) {
      return NextResponse.json(
        { error: "Cvičení nebylo nalezeno." },
        { status: 404 }
      );
    }
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error("PUT /api/admin/exercises error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se upravit cvičení." },
      { status: 500 }
    );
  }
}
