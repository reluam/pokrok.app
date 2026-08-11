"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopMenu } from "./TopMenu";
import { ContactPanel, HomePanel, ProjectsPanel, ThoughtsPanel, WorkPanel } from "./panels";
import type { Lang } from "@/lib/dictionaries";
import { SECTIONS, indexForPath } from "@/lib/site/sections";

const LANG_COOKIE = "mm_lang";

/** Delší skok = delší animace, ať je znát, že se projelo přes mezilehlé sekce. */
function durationFor(distance: number) {
  return Math.min(560 + 200 * Math.max(0, distance - 1), 1300);
}

/** Čím delší skok, tím větší pohybová neostrost — strop drží cenu za překreslení nízko. */
function blurFor(distance: number) {
  return Math.min(3 + 2.5 * distance, 11);
}

/**
 * Vodorovný pás všech pěti stránek. Navigace nemění stromy komponent (žádný
 * router push) — jen posune pás a přepíše URL přes History API, takže přechod
 * jde animovat plynule. Přímý vstup na /contact vykreslí pás rovnou na pozici 4.
 */
export function SiteStrip({
  initialIndex,
  initialLang,
}: {
  initialIndex: number;
  initialLang: Lang;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [duration, setDuration] = useState(0);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);
  // index drží i ref, aby `move` zůstal čistý (updater funkce se ve StrictMode volá dvakrát)
  const indexRef = useRef(initialIndex);

  const reducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const move = useCallback((next: number, push: boolean) => {
    const prev = indexRef.current;
    if (next === prev) return;
    indexRef.current = next;

    const distance = Math.abs(next - prev);
    const reduced = reducedMotion();
    const ms = reduced ? 0 : durationFor(distance);
    setDuration(ms);
    setIndex(next);
    if (push) window.history.pushState({ mmIndex: next }, "", SECTIONS[next].href);

    // Blur pouštíme imperativně: animaci je potřeba restartovat i při skoku
    // na stejnou vzdálenost, což by se stejnými props samo nenastalo.
    const el = stripRef.current;
    if (!el || reduced) return;
    el.style.animation = "none";
    void el.offsetWidth; // vynucený reflow → animace se spustí znovu od nuly
    el.style.setProperty("--mm-blur", `${blurFor(distance)}px`);
    el.style.animation = `mm-glide ${ms}ms cubic-bezier(0.76, 0, 0.24, 1)`;
  }, []);

  const navigate = useCallback((next: number) => move(next, true), [move]);

  // Zpět/vpřed v prohlížeči → pás se posune na pozici odpovídající URL (bez dalšího pushState).
  useEffect(() => {
    const onPop = () => move(indexForPath(window.location.pathname), false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [move]);

  // Titulek musí sledovat URL, protože skutečná navigace neproběhne.
  useEffect(() => {
    const s = SECTIONS[index];
    document.title = index === 0 ? s.title[lang] : `${s.title[lang]} — ${SECTIONS[0].title[lang]}`;
    panelRefs.current[index]?.scrollTo({ top: 0 });
  }, [index, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "cs" ? "en" : "cs";
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <div className="mm-viewport">
      <TopMenu lang={lang} index={index} onNavigate={navigate} onToggleLang={toggleLang} />

      <div
        ref={stripRef}
        className="mm-strip"
        style={{ transform: `translate3d(${-index * 100}vw, 0, 0)`, transitionDuration: `${duration}ms` }}
      >
        {SECTIONS.map((s, i) => (
          <section
            key={s.id}
            className="mm-panel"
            ref={(el) => { panelRefs.current[i] = el; }}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            {s.id === "home" && <HomePanel lang={lang} onNavigate={navigate} />}
            {s.id === "work" && <WorkPanel lang={lang} />}
            {s.id === "projects" && <ProjectsPanel lang={lang} />}
            {s.id === "thoughts" && <ThoughtsPanel lang={lang} />}
            {s.id === "contact" && <ContactPanel lang={lang} />}
          </section>
        ))}
      </div>
    </div>
  );
}
