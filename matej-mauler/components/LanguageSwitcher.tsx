"use client";

import { Lang } from "@/lib/dictionaries";

export function LanguageSwitcher({
  lang,
  labels,
}: {
  lang: Lang;
  labels: { cs: string; en: string };
}) {
  const setLang = (target: Lang) => {
    // Persist preference for one year
    document.cookie = `lang=${target}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.href = target === "cs" ? "/" : "/en";
  };

  const baseBtn =
    "font-display font-bold text-xs uppercase tracking-[0.1em] px-2.5 py-1 rounded-full transition-colors";
  const active = "bg-primary text-white";
  const inactive = "text-muted hover:text-foreground";

  return (
    <div className="absolute top-5 right-5 md:top-6 md:right-8 z-10">
      <div className="paper-card flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setLang("cs")}
          className={`${baseBtn} ${lang === "cs" ? active : inactive}`}
          aria-label="Čeština"
        >
          {labels.cs}
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`${baseBtn} ${lang === "en" ? active : inactive}`}
          aria-label="English"
        >
          {labels.en}
        </button>
      </div>
    </div>
  );
}
