import { SongsAdmin } from "@/components/SongsAdmin";
import { getAllSongs, type SongRow } from "@/lib/songsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Songs — Spaghetti HQ" };

export default async function SongsAdminPage() {
  let rows: SongRow[] = [];
  try { rows = await getAllSongs(); } catch { rows = []; }
  return <SongsAdmin initial={rows} />;
}
