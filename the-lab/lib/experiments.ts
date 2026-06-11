export type ExperimentMeta = {
  slug: string;
  emoji: string;
  color: string;
  href: string;
  external?: boolean;
  title: { cs: string; en: string };
  desc: { cs: string; en: string };
};

// Statický registr — slouží jako seed DB tabulky lab_experiments a jako
// fallback homepage při výpadku DB. Pravda o publikování/pořadí žije v DB (admin).
export const experiments: ExperimentMeta[] = [
  {
    slug: "sound", emoji: "🔊", color: "#E0E7FF", href: "/sound",
    title: { cs: "Cesta po zvukové vlně", en: "A journey along a sound wave" },
    desc: { cs: "Tvůj kurzor je ucho. Scrolluj zvukem od chvění po ozvěnu — a všechno si poslechni.", en: "Your cursor is an ear. Scroll through sound from a tremble to an echo — and hear it all." },
  },
  {
    slug: "music", emoji: "🎶", color: "#efe9fb", href: "/music",
    title: { cs: "Jak vzniká hudba", en: "How music is made" },
    desc: { cs: "Poskládej skladbu po vrstvách: beat, basa, akordy, melodie. Mřížky, fadery, efekty.", en: "Build a track layer by layer: beat, bass, chords, melody. Grids, faders, effects." },
  },
  {
    slug: "spaghetti", emoji: "🍝", color: "#FEF3C7", href: "https://spaghetti.ltd", external: true,
    title: { cs: "Spaghetti.ltd", en: "Spaghetti.ltd" },
    desc: { cs: "Interaktivní encyklopedie propojená nudlemi poznání. Vesmír, zvuk, Stopařův průvodce a další.", en: "An interactive encyclopedia connected by knowledge noodles. Space, sound, the Hitchhiker's Guide and more." },
  },
  {
    slug: "radio", emoji: "📻", color: "#DCFCE7", href: "/radio",
    title: { cs: "Rádio", en: "The Radio" },
    desc: { cs: "Nekonečné generativní rádio — hlasuj o jednotlivých buňkách a nalaď, co poletí éterem dál.", en: "An endless generative radio — vote on the cells and tune what plays next." },
  },
  {
    slug: "brain", emoji: "🧠", color: "#FCE7F3", href: "/brain",
    title: { cs: "Veřejný mozek", en: "The Public Brain" },
    desc: { cs: "Slovo → asociace. Každá odpověď posílí synapsi ve společném mozku internetu.", en: "Word → association. Every answer strengthens a synapse in the internet's shared brain." },
  },
];
