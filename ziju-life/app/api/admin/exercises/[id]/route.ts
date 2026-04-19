import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { deleteExercise } from "@/lib/exercises";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifySession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Chybí ID cvičení." }, { status: 400 });
    }

    const deleted = await deleteExercise(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Cvičení nebylo nalezeno." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/exercises/[id] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se smazat cvičení." },
      { status: 500 }
    );
  }
}
