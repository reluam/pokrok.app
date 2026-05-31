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
