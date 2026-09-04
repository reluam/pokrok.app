import type { Metadata } from "next";
import { Oswald, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { MilansWorld } from "@/components/milans-world/MilansWorld";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import "./milans-world.css";

// Hra má vlastní typografii (úřední formulář), ne spaghetti fonty. Načítá se jen
// na téhle routě a jde do CSS proměnných, které čte milans-world.css.
const display = Oswald({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--msw-display", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--msw-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--msw-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Milan's World — Spaghetti.ltd",
  description:
    "A clicker about the idea that money solves everything. Stamp forms at the city hall, buy your way from a wheelie bin to the universe — and find out the goal is unreachable by design.",
  alternates: { canonical: "/milans-world" },
};

export default async function Page() {
  await guardExperiment("milans-world");
  const lang = await getLang();
  return (
    <div className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <MilansWorld initialLang={lang} />
    </div>
  );
}
