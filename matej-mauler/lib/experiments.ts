export type ExperimentMeta = {
  slug: string;
  emoji: string;
  color: string;
  href: string | null;
  size?: "wide";
  wip?: boolean;
  external?: boolean;
};

// Kategorie pro tag na kartě (jazykově neutrální, krátké)
export const CATEGORIES: Record<string, string> = {
  encyklopedie: "wiki",
  sound: "audio",
  music: "audio",
  radio: "audio",
  brain: "mind",
};

export const experiments: ExperimentMeta[] = [
  {
    slug: "encyklopedie",
    emoji: "🍝",
    color: "#FEF3C7",
    href: "/encyklopedie",
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
    href: "/synapse",
  },
];
