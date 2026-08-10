// Projekty do lišty na homepage. Editace = jen tenhle soubor, layout ani CSS se nesahá.
// `typeStyle` mapuje na font/váhu (viz .mm-project v globals.css), `status` na vizuální váhu
// (active = plná, past = tišší). Žádné taby, žádné sekce — pořadí v poli = pořadí v liště.

export type Project = {
  name: string;
  /** Chybí-li URL, vykreslí se jen text (radši než mrtvý odkaz). */
  url?: string;
  status: "active" | "past";
  typeStyle: "voice" | "mono" | "sans";
};

export const projects: Project[] = [
  { name: "Matt Mauler", url: "https://soundcloud.com/matt-mauler", status: "active", typeStyle: "voice" },
  { name: "Spaghetti.ltd", url: "https://www.spaghetti.ltd", status: "active", typeStyle: "mono" },
  // TODO: doplnit URL, až bude kam odkázat
  { name: "Stats & Facts", status: "active", typeStyle: "sans" },
];
