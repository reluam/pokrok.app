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
];
