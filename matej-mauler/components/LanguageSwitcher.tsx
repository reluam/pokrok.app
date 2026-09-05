"use client";

import type { Lang } from "@/lib/dictionaries";

/**
 * Přepínač jazyka. Sám nic neukládá — jen navede prohlížeč na `?lang=`
 * a cookie nastaví proxy.ts. Jedna cesta, jak se jazyk mění, ne dvě.
 */
export function LanguageSwitcher({ lang }: { lang: Lang }) {
  const go = (target: Lang) => {
    if (target === lang) return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", target);
    window.location.href = url.toString();
  };

  return (
    <div className="langsw" role="group" aria-label={lang === "cs" ? "Jazyk" : "Language"}>
      {(["cs", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => go(l)}
          aria-pressed={lang === l}
          aria-label={l === "cs" ? "Čeština" : "English"}
        >
          {l === "cs" ? "CZ" : "EN"}
        </button>
      ))}
    </div>
  );
}
