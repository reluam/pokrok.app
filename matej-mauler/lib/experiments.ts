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
    slug: "journey",
    emoji: "🌌",
    color: "#C8DCFF",
    href: "http://localhost:3002",
    size: "wide",
    external: true,
  },
  {
    slug: "cas",
    emoji: "⏳",
    color: "#FEF3C7",
    href: "/kolik-ti-zbyva",
  },
  {
    slug: "42",
    emoji: "☄️",
    color: "#D1FAE5",
    href: "/42",
  },
  {
    slug: "otazky",
    emoji: "🔮",
    color: "#EDE9FE",
    href: null,
    wip: true,
  },
  {
    slug: "rozhodnuti",
    emoji: "🎲",
    color: "#FFE4CC",
    href: null,
    wip: true,
  },
  {
    slug: "nahoda",
    emoji: "✦",
    color: "#FCE7F3",
    href: null,
    wip: true,
  },
];
