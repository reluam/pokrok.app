import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getAllPrinciples,
  createPrinciple,
  updatePrinciple,
} from "@/lib/principles";

export async function GET(request: NextRequest) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeInactive =
    request.nextUrl.searchParams.get("includeInactive") === "true";

  try {
    const principles = await getAllPrinciples({ includeInactive });
    return NextResponse.json({ principles });
  } catch (error) {
    console.error("GET /api/admin/principles error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst principy." },
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

    if (!title || !slug || !shortDescription) {
      return NextResponse.json(
        { error: "Vyplň název, slug i krátký popis." },
        { status: 400 }
      );
    }

    const principle = await createPrinciple({
      title,
      slug,
      shortDescription,
      contentMarkdown:
        typeof body.contentMarkdown === "string" &&
        body.contentMarkdown.trim().length > 0
          ? body.contentMarkdown
          : shortDescription,
      orderIndex:
        typeof body.orderIndex === "number"
          ? body.orderIndex
          : Number(body.orderIndex ?? 0) || 0,
      videoUrl:
        typeof body.videoUrl === "string" && body.videoUrl.trim().length > 0
          ? body.videoUrl.trim()
          : null,
      relatedInspirationIds: Array.isArray(body.relatedInspirationIds)
        ? body.relatedInspirationIds.map((id: unknown) => String(id))
        : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json({ principle });
  } catch (error) {
    console.error("POST /api/admin/principles error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit princip." },
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
        { error: "Chybí ID principu." },
        { status: 400 }
      );
    }

    const updates: {
      title?: string;
      slug?: string;
      shortDescription?: string;
      contentMarkdown?: string;
      orderIndex?: number;
      videoUrl?: string | null;
      relatedInspirationIds?: string[];
      isActive?: boolean;
    } = {};

    if (typeof body.title === "string") {
      updates.title = body.title.trim();
    }
    if (typeof body.slug === "string") {
      updates.slug = body.slug.trim();
    }
    if (typeof body.shortDescription === "string") {
      updates.shortDescription = body.shortDescription.trim();
    }
    if (typeof body.contentMarkdown === "string") {
      updates.contentMarkdown = body.contentMarkdown;
    }
    if (body.orderIndex !== undefined) {
      const n =
        typeof body.orderIndex === "number"
          ? body.orderIndex
          : Number(body.orderIndex);
      if (!Number.isNaN(n)) {
        updates.orderIndex = n;
      }
    }
    if (body.videoUrl !== undefined) {
      if (
        typeof body.videoUrl === "string" &&
        body.videoUrl.trim().length > 0
      ) {
        updates.videoUrl = body.videoUrl.trim();
      } else {
        updates.videoUrl = null;
      }
    }
    if (body.relatedInspirationIds !== undefined) {
      if (Array.isArray(body.relatedInspirationIds)) {
        updates.relatedInspirationIds = body.relatedInspirationIds.map(
          (id: unknown) => String(id)
        );
      } else {
        updates.relatedInspirationIds = [];
      }
    }
    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    const principle = await updatePrinciple(id, updates);
    if (!principle) {
      return NextResponse.json(
        { error: "Princip nebyl nalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ principle });
  } catch (error) {
    console.error("PUT /api/admin/principles error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se upravit princip." },
      { status: 500 }
    );
  }
}

