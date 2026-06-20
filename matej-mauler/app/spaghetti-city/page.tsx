import { SpaghettiCity } from "@/components/SpaghettiCity";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Spaghetti City — Spaghetti.ltd",
  description:
    "An on-chain economic simulation: claim a soulbound citizenship, own parcels, build and trade in $RAGU. A game that teaches why and how blockchain works — by doing.",
  alternates: { canonical: "/spaghetti-city" },
};

export default async function SpaghettiCityPage() {
  await guardExperiment("spaghetti-city");
  const lang = await getLang();
  return <SpaghettiCity lang={lang} />;
}
