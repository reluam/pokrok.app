import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { addComment, listComments } from "@/lib/commentsDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page");
    if (!page) return NextResponse.json({ error: "missing page" }, { status: 400 });
    const comments = await listComments(page);
    return NextResponse.json({ comments });
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
    const body = typeof b?.body === "string" ? b.body : "";
    const parentId = Number.isInteger(b?.parentId) ? b.parentId : null;
    if (!page) return NextResponse.json({ error: "missing page" }, { status: 400 });

    const user = await currentUser();
    const authorName = user?.fullName || user?.username || user?.firstName || "Anonymous";
    const authorAvatar = user?.imageUrl ?? null;

    const res = await addComment({ pageSlug: page, parentId, userId, authorName, authorAvatar, body });
    if ("error" in res) return NextResponse.json(res, { status: 400 });
    return NextResponse.json({ comment: res });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
