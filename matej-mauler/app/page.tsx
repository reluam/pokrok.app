import type { Metadata } from "next";
import { HomeNetwork } from "@/components/HomeNetwork";
import { dictionaries } from "@/lib/dictionaries";
import { getPublicExperiments } from "@/lib/experimentsDb";
import { applyTextOverrides, getTextOverrides } from "@/lib/siteTextsDb";
import { getLang } from "@/lib/getLang";

// Homepage se renderuje při každém požadavku — getLang() sahá na cookie, což je
// dynamické API. Databázi to nestojí nic: getPublicExperiments() i getTextOverrides()
// mají vlastní unstable_cache s revalidateTag, takže se cachují dál. Platíme render,
// ne dotazy. (Statická byla jen po dobu, co byl web zamčený na angličtinu.)
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "Spaghetti.ltd",
    description: dictionaries[lang].meta.description,
    alternates: {
      canonical: "/",
      languages: { en: "/?lang=en", cs: "/?lang=cs", "x-default": "/" },
    },
  };
}

export default async function Home() {
  const lang = await getLang();
  const [items, overrides] = await Promise.all([
    getPublicExperiments(lang),
    getTextOverrides(lang).catch(() => ({})),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Spaghetti.ltd",
    url: "https://www.spaghetti.ltd",
    description: dictionaries[lang].meta.description,
    inLanguage: lang,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeNetwork dict={applyTextOverrides(dictionaries[lang], overrides)} lang={lang} items={items} />
    </>
  );
}
