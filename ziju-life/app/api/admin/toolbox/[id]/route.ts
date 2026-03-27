import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { deleteTool } from "@/lib/toolbox-db";

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
        { error: "Chybí ID nástroje." },
        { status: 400 }
      );
    }

    const deleted = await deleteTool(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Nástroj nebyl nalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/toolbox/[id] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se smazat nástroj." },
      { status: 500 }
    );
  }
}
