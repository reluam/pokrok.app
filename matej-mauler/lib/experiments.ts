export type ExperimentMeta = {
  slug: string;
  emoji: string;
  color: string;
  href: string | null;
  size?: "wide";
  wip?: boolean;
  external?: boolean;
  /** Funguje i bez databáze → smí se ukázat, když je DB nedostupná. */
  offline?: true;
};

// Kategorie pro tag na kartě (jazykově neutrální, krátké)
export const CATEGORIES: Record<string, string> = {
  encyklopedie: "wiki",
  sound: "audio",
  music: "audio",
  radio: "audio",
  brain: "mind",
  "milans-world": "game",
};

export const experiments: ExperimentMeta[] = [
  {
    slug: "encyklopedie",
    emoji: "🍝",
    color: "#FEF3C7",
    href: "/encyclopedia",
    size: "wide",
  },
  {
    slug: "sound",
    emoji: "🔊",
    color: "#E0E7FF",
    href: "/sound",
  },
  {
    slug: "music",
    emoji: "🎶",
    color: "#efe9fb",
    href: "/music",
  },
  {
    slug: "radio",
    emoji: "📻",
    color: "#DCFCE7",
    href: "/radio",
  },
  {
    slug: "brain",
    emoji: "⚡",
    color: "#FCE7F3",
    href: "/synapsis",
  },
  {
    slug: "milans-world",
    emoji: "🪧",
    color: "#E3E6DC",
    href: "/milans-world",
    // Celá hra běží v prohlížeči (localStorage) → přežije výpadek databáze.
    offline: true,
  },
  {
    slug: "driftbloom",
    emoji: "🌱",
    color: "#DCFCE7",
    href: "/driftbloom",
  },
  {
    slug: "rules",
    emoji: "🕹️",
    color: "#E0E7FF",
    href: "/rules",
  },
];
