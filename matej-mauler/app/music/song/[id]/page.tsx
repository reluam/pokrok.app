import { notFound } from "next/navigation";
import { SongPlayer } from "@/components/SongPlayer";
import { getLang } from "@/lib/getLang";
import { getSong } from "@/lib/musicServer";
import type { SongDetail } from "@/lib/music";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Song #${id} — Spaghetti.ltd` };
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  let song: SongDetail | null = null;
  try { song = await getSong(Number(id)); } catch { song = null; }
  if (!song) notFound();
  return <SongPlayer lang={lang} initial={song} />;
}
