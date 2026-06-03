export type ExperimentMeta = {
  slug: string;
  emoji: string;
  color: string;
  href: string | null;
  size?: "wide";
  wip?: boolean;
  external?: boolean;
};

export const experiments: ExperimentMeta[] = [
  {
    slug: "cas",
    emoji: "⏳",
    color: "#FEF3C7",
    href: "/kolik-ti-zbyva",
  },
  {
    slug: "vvv",
    emoji: "📚",
    color: "#FEF9C3",
    href: "/vvv",
  },
  {
    slug: "odds",
    emoji: "🎯",
    color: "#DBEAFE",
    href: "/what-are-the-odds",
  },
  {
    slug: "sonify",
    emoji: "🎵",
    color: "#FCE7F3",
    href: "/jak-to-zni",
  },
  {
    slug: "foundry",
    emoji: "🔊",
    color: "#F3E8FF",
    href: "/sound-foundry",
  },
  {
    slug: "musicvote",
    emoji: "🎼",
    color: "#DCFCE7",
    href: "/music",
  },
  {
    slug: "radio",
    emoji: "📻",
    color: "#E0E7FF",
    href: "/radio",
  },
  {
    slug: "anthem",
    emoji: "🎺",
    color: "#FEE2E2",
    href: "/hymna",
  },
  {
    slug: "journey",
    emoji: "🌱",
    color: "#FDE68A",
    href: "/journey",
    size: "wide",
  },
  {
    slug: "space",
    emoji: "🌌",
    color: "#C7D2FE",
    href: "/space",
  },
];
