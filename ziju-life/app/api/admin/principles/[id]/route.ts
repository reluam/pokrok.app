import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { deletePrinciple } from "@/lib/principles";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifySession();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Chybí ID principu." },
        { status: 400 }
      );
    }

    const deleted = await deletePrinciple(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Princip nebyl nalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/principles/[id] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se smazat princip." },
      { status: 500 }
    );
  }
}

