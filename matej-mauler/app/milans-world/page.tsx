import { Oswald, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { MilansWorld } from "@/components/milans-world/MilansWorld";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";
import "./milans-world.css";
import { experienceMetadata } from "@/lib/experienceMetadata";

// Hra má vlastní typografii (úřední formulář), ne spaghetti fonty. Načítá se jen
// na téhle routě a jde do CSS proměnných, které čte milans-world.css.
const display = Oswald({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--msw-display", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--msw-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--msw-mono", display: "swap" });

export const generateMetadata = () => experienceMetadata("/milans-world");

export default async function Page() {
  await guardExperiment("milans-world");
  const lang = await getLang();
  return (
    <div className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <MilansWorld initialLang={lang} />
    </div>
  );
}
