"use client";

import dynamic from "next/dynamic";
import type { Lang } from "@/lib/dictionaries";

// Load all wallet code client-side only — keeps wagmi/RainbowKit out of SSR
// and out of the public site's bundle.
const CityClient = dynamic(() => import("./CityClient").then((m) => m.CityClient), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border-2 border-neutral-900/85 bg-[#FDFBF7] p-5 text-sm text-neutral-500">
      …
    </div>
  ),
});

export function CityGate({ lang }: { lang: Lang }) {
  return <CityClient lang={lang} />;
}
