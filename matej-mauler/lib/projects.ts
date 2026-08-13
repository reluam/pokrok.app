import type { Bi } from "@/lib/about";

// Projekty do sekce „Čemu se věnuju teď". Editace = jen tenhle soubor, layout ani CSS se nesahá.
// `typeStyle` mapuje na font/váhu (viz .mm-project v globals.css), `status` na vizuální váhu
// (active = plná, past = tišší). Pořadí v poli = pořadí na stránce.

export type Project = {
  name: string;
  /** Chybí-li URL, vykreslí se jen text (radši než mrtvý odkaz). */
  url?: string;
  status: "active" | "past";
  typeStyle: "voice" | "mono" | "sans";
  /** Co to je a proč to dělám. */
  blurb: Bi;
};

export const projects: Project[] = [
  {
    name: "Matt Mauler",
    url: "https://soundcloud.com/matt-mauler",
    status: "active",
    typeStyle: "voice",
    blurb: {
      cs: "Hudba. Nejstarší věc, co dělám. Nahrávky jsou na SoundCloudu.",
      en: "Music. The oldest thing I do. Tracks are on SoundCloud.",
    },
  },
  {
    name: "Spaghetti.ltd",
    url: "https://www.spaghetti.ltd",
    status: "active",
    typeStyle: "mono",
    blurb: {
      cs: "Interaktivní webové experimenty — zvuk, hudba, rádio běžící na serveru, encyklopedie, hry. Spousta z nich je nedodělaná a skoro nikdo je neviděl.",
      en: "Interactive web experiments — sound, music, a radio that runs on the server, an encyclopedia, games. Plenty of them are unfinished and hardly anyone has seen them.",
    },
  },
  {
    name: "Stats & Facts",
    status: "active",
    typeStyle: "sans",
    blurb: {
      cs: "Interaktivní reporty, postavené tak, abys viděl, na čem ta čísla visí. Je to na začátku — pořád to běží na dočasné doméně, takže odkaz zatím není.",
      en: "Interactive reports, built so you can see what the numbers connect to. It's early — it still lives on a temporary domain, so there's no link yet.",
    },
  },
];
