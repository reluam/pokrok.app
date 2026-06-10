import type { Metadata } from "next";
import { MapView } from "@/components/encyclopedia/MapView";
import { getLang } from "@/lib/getLang";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mapa všeho — Spaghetti.ltd" };

export default async function MapaPage() {
  const lang = await getLang();
  return <MapView lang={lang} />;
}
