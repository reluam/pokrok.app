"use client";

import { usePathname } from "next/navigation";
import { ExperiencePanel } from "./ExperiencePanel";
import { experienceForPath } from "@/lib/experiencePanel";

// Globální mount v layoutu: podle pathname najde experience a vykreslí panel.
// Bez Clerk hooků → bezpečné i bez ClerkProvideru (ExperiencePanel se sám vypne bez klíče).
export function ExperiencePanelMount() {
  const info = experienceForPath(usePathname());
  if (!info) return null;
  return (
    <ExperiencePanel
      slug={info.slug}
      title={info.title}
      category={info.category}
      description={info.description}
      guide={info.guide}
    />
  );
}
