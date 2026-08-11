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
      cs: "Hudba. Nejstarší věc, co dělám, a jediná, u které nikdy neřeším, jestli dává smysl — prostě ji dělat musím. Nahrávky žijí na SoundCloudu.",
      en: "Music. The oldest thing I do, and the only one where I never ask whether it makes sense — I just have to. The tracks live on SoundCloud.",
    },
  },
  {
    name: "Spaghetti.ltd",
    url: "https://www.spaghetti.ltd",
    status: "active",
    typeStyle: "mono",
    blurb: {
      cs: "Moje laboratoř. Interaktivní webové experimenty, u kterých si věci spíš osaháš, než abys o nich četl — zvuk, hudba, rádio běžící na serveru, encyklopedie i hry. Vzniká, protože mě baví zkoušet, co ještě web unese.",
      en: "My lab. Interactive web experiments where you feel how something works instead of reading about it — sound, music, a server-run radio, an encyclopedia, games. It exists because I like finding out what the web still puts up with.",
    },
  },
  {
    // TODO: doplnit URL a upřesnit popis — o tomhle projektu vím zatím nejmíň
    name: "Stats & Facts",
    status: "active",
    typeStyle: "sans",
    blurb: {
      cs: "TODO: doplnit. Zatím jen pracovní název — čísla a fakta, která stojí za to ukázat srozumitelně.",
      en: "TODO: fill in. A working title for now — numbers and facts worth showing in a way people actually get.",
    },
  },
];
