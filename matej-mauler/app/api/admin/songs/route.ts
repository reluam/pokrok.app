import { NextRequest, NextResponse } from "next/server";
import { getAllSongs, createSong } from "@/lib/songsDb";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getAllSongs()); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const title = String(b.title || "").trim();
    const audio_url = String(b.audio_url || "").trim();
    if (!title || !audio_url) return NextResponse.json({ error: "title a audio_url povinné" }, { status: 400 });
    const slug = (String(b.slug || title).trim().toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) || `song-${Date.now()}`;
    await createSong({
      slug, title,
      note_cs: b.note_cs || "", note_en: b.note_en || "",
      audio_url, cover_url: b.cover_url || null,
      released_at: b.released_at || null,
    });
    return NextResponse.json({ ok: true, slug });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
