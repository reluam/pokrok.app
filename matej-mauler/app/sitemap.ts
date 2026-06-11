import type { MetadataRoute } from "next";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { NODES } from "@/lib/encyclopedia/nodes";

export const dynamic = "force-dynamic";

const SITE = "https://spaghetti.ltd";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getPublicExperiments("en");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/cs`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/mapa`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/songs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // jen interní (ne external) publikované experimenty; smazané/draft tu nejsou
  for (const it of items) {
    if (it.external || !it.href.startsWith("/")) continue;
    entries.push({
      url: `${SITE}${it.href}`,
      lastModified: it.date ? new Date(it.date) : now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // hesla encyklopedie (červené odkazy ne — ty jsou noindex)
  for (const slug of Object.keys(NODES)) {
    if (slug === "vesmir" || slug === "brana") continue; // vesmir je v experimentech, brána = "/"
    entries.push({ url: `${SITE}/${slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}
