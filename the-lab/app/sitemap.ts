import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://the-lab.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/sound`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/music`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
