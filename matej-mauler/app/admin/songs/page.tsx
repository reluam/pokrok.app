import { SongsAdmin, type AdminMessage } from "@/components/SongsAdmin";
import { getAllSongs, getAllMessages, type SongRow } from "@/lib/songsDb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Songs — Spaghetti HQ" };

export default async function SongsAdminPage() {
  let rows: SongRow[] = [];
  let messages: AdminMessage[] = [];
  try { rows = await getAllSongs(); } catch { rows = []; }
  try { messages = await getAllMessages() as AdminMessage[]; } catch { messages = []; }
  return <SongsAdmin initial={rows} initialMessages={messages} />;
}
