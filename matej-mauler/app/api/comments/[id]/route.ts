import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteComment } from "@/lib/commentsDb";
import { isAdmin } from "@/lib/adminAuth";
import { ACCOUNTS_ENABLED } from "@/lib/features";

export const dynamic = "force-dynamic";

// Účty jsou schované (lib/features.ts) → tahle routa neexistuje. Kód i DB tabulky
// zůstávají; až se účty vrátí, guard zmizí sám s přepnutím vlajky.
const off = () => NextResponse.json({ error: "not found" }, { status: 404 });


export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!ACCOUNTS_ENABLED) return off();
  try {
    const { userId } = await auth();
    const admin = await isAdmin();
    if (!userId && !admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const ok = await deleteComment(numId, userId ?? "", admin);
    if (!ok) return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
