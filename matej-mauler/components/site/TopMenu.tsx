"use client";

import { SECTIONS } from "@/lib/site/sections";
import { COPY } from "@/lib/site/copy";
import type { Lang } from "@/lib/dictionaries";

/**
 * Fixní lišta nahoře — široká přesně jako její obsah (inline-flex pill), takže
 * se pás pod ní může posouvat, ale menu zůstává na místě. Odkazy jsou pravé <a>
 * (funguje i bez JS), klik ale odchytáváme a řešíme posunem pásu.
 */
export function TopMenu({
  lang,
  index,
  onNavigate,
  onToggleLang,
}: {
  lang: Lang;
  index: number;
  onNavigate: (index: number) => void;
  onToggleLang: () => void;
}) {
  return (
    <nav className="mm-menu" aria-label={lang === "cs" ? "Hlavní menu" : "Main menu"}>
      <div className="mm-menu-pill">
        {/* Schválně <a>, ne <Link>: router push by panel odmountoval a zabil animaci pásu.
            Klik odchytáváme, href zůstává kvůli funkčnosti bez JS a pro „otevřít v novém tabu". */}
        {/* Hlavní stránka nemá v menu položku — vede na ni jen logo (aktivní = invertované). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className={`mm-menu-logo${index === 0 ? " is-active" : ""}`}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            onNavigate(0);
          }}
          aria-current={index === 0 ? "page" : undefined}
          aria-label={SECTIONS[0].title[lang]}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={26} height={26} />
        </a>

        <ul className="mm-menu-list">
          {SECTIONS.slice(1).map((s, i) => {
            const position = i + 1;
            return (
              <li key={s.id}>
                <a
                  href={s.href}
                  className={`mm-menu-link${position === index ? " is-active" : ""}`}
                  aria-current={position === index ? "page" : undefined}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    onNavigate(position);
                  }}
                >
                  {s.nav[lang]}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Ukazuje jazyk, ve kterém web právě je; klik přepne na ten druhý. */}
        <button type="button" className="mm-menu-lang" onClick={onToggleLang} title={COPY.langSwitch[lang]} aria-label={COPY.langSwitch[lang]}>
          {lang === "cs" ? "CZ" : "EN"}
        </button>
      </div>
    </nav>
  );
}
