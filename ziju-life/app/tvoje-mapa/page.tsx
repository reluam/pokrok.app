import type { Metadata } from "next";
import MapaIntroCard from "./MapaIntroCard";

export const metadata: Metadata = {
  title: "Tvoje mapa | Žiju life",
  description: "Vytvoř si mapu svých rituálů, struktury týdne a milníků — konkrétní plán jak se pohybovat k životu, který chceš.",
};

export default async function TvojeMapa() {
  return <MapaIntroCard />;
}
