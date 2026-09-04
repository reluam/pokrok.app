"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, radiusForViewport, type GlobeShape } from "./Globe";
import { TopMenu } from "./TopMenu";
import { ContactPanel, HomePanel, IdeasPanel, WorkPanel } from "./panels";
import type { Lang } from "@/lib/dictionaries";
import { CONTINENTS, continentShape, nearestContinent, rotationFor, type ContinentId } from "@/lib/site/continents";
import { COUNTRIES, countryShape } from "@/lib/site/countries";
import { angularDistance, shortestRotation, type Rotation } from "@/lib/site/globe";
import { SECTIONS, indexForPath } from "@/lib/site/sections";

const LANG_COOKIE = "mm_lang";

/** Delší otočka = delší animace, ať je znát, že se projelo přes oceán. */
function durationFor(degrees: number) {
  return Math.min(560 + degrees * 3, 1300);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Koule jako navigace. Stav (natočení, aktivní kontinent, jazyk) drží tahle
 * komponenta, kreslí Globe. Navigace nemění stromy komponent — jen otočí kouli
 * a přepíše URL přes History API, takže přechod jde animovat. Přímý vstup na
 * /work vykreslí kouli rovnou natočenou na kontinent Práce.
 */
export function GlobeShell({
  initialIndex,
  initialLang,
}: {
  initialIndex: number;
  initialLang: Lang;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [rotation, setRotation] = useState<Rotation>(() =>
    rotationFor(SECTIONS[initialIndex].id as ContinentId),
  );
  const [zoomed, setZoomed] = useState(false);
  // Koule se sází v pixelech okna, ne v abstraktních jednotkách — jinak by se
  // „obzor jen v rozích" rozpadl na jiném poměru stran. 0×0 do prvního měření:
  // server nezná okno a SSR musí dát stejný výstup jako první render v prohlížeči.
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // index a rotace jedou i v refech: animační smyčka i pointer handlery musí
  // číst aktuální hodnotu, aniž by se kvůli tomu překreslovaly
  const indexRef = useRef(initialIndex);
  const rotationRef = useRef(rotation);
  const rafRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);

  const applyRotation = useCallback((r: Rotation) => {
    rotationRef.current = r;
    setRotation(r);
  }, []);

  /** Plynule dojede na cílové natočení. Kratší cestou, s délkou podle úhlu. */
  const animateTo = useCallback(
    (target: Rotation) => {
      cancelAnimationFrame(rafRef.current);
      const from = rotationRef.current;
      const to = { lon0: shortestRotation(from.lon0, target.lon0), lat0: target.lat0 };
      const ms = reducedMotion() ? 0 : durationFor(angularDistance(from, to));
      if (ms === 0) {
        applyRotation(to);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = easeInOut(t);
        applyRotation({
          lon0: from.lon0 + (to.lon0 - from.lon0) * e,
          lat0: from.lat0 + (to.lat0 - from.lat0) * e,
        });
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [applyRotation],
  );

  const goTo = useCallback(
    (next: number, push: boolean) => {
      indexRef.current = next;
      setIndex(next);
      // přiblížení patří jednomu kontinentu — otočení jinam ho vždycky zavře
      setZoomed(false);
      setActiveCountry(null);
      if (push) window.history.pushState({ mmIndex: next }, "", SECTIONS[next].href);
      animateTo(rotationFor(SECTIONS[next].id as ContinentId));
    },
    [animateTo],
  );

  const navigate = useCallback((next: number) => goTo(next, next !== indexRef.current), [goTo]);

  const selectContinent = useCallback(
    (id: string) => {
      const next = SECTIONS.findIndex((s) => s.id === id);
      if (next >= 0) navigate(next);
    },
    [navigate],
  );

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Zpět/vpřed v prohlížeči → koule se otočí na kontinent podle URL (bez dalšího pushState).
  useEffect(() => {
    const onPop = () => goTo(indexForPath(window.location.pathname), false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goTo]);

  // Šipky otáčejí na sousední kontinent, Esc zavře přiblížení. Menu zůstává
  // plnou náhradou za tažení, tohle je jen zrychlení.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") { setZoomed(false); return; }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = (indexRef.current + step + SECTIONS.length) % SECTIONS.length;
      goTo(next, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  // Titulek musí sledovat URL, protože skutečná navigace neproběhne.
  useEffect(() => {
    const s = SECTIONS[index];
    document.title = index === 0 ? s.title[lang] : `${s.title[lang]} — ${SECTIONS[0].title[lang]}`;
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

  /* ── tažení ── */

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    // posun o poloměr koule = 90° otočení
    const perPx = 90 / Math.max(1, radius);
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.moved += Math.abs(dx) + Math.abs(dy);
    d.x = e.clientX;
    d.y = e.clientY;
    const r = rotationRef.current;
    applyRotation({
      lon0: r.lon0 - dx * perPx,
      // strop ±60°, aby se koule nepřetočila přes pól
      lat0: Math.max(-60, Math.min(60, r.lat0 + dy * perPx)),
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    // krátký tah = klik, ten si řeší Globe sám
    if (d.moved < 6) return;
    const target = nearestContinent(rotationRef.current);
    const next = SECTIONS.findIndex((s) => s.id === target.id);
    goTo(next, next !== indexRef.current);
  };

  // Přiblížení na kontinent Práce = větší poloměr, ne škálování skupiny:
  // koule je kulisa přes celé okno, takže „přijít blíž" je přesně tohle.
  const radius = radiusForViewport(size.w, size.h) * (zoomed ? 2.3 : 1);

  const onWork = SECTIONS[index].id === "work";

  const regions: GlobeShape[] = zoomed && onWork
    ? COUNTRIES.map((c) => ({ id: c.id, label: c.org, points: countryShape(c), seat: c.seat }))
    : [];

  const shapes: GlobeShape[] = CONTINENTS.map((c) => {
    const section = SECTIONS.find((s) => s.id === c.id)!;
    return {
      id: c.id,
      label: section.nav[lang],
      points: continentShape(c),
      seat: c.centroid,
      href: section.href,
    };
  });

  /** Klik na kontinent, který už je vepředu, otevře jeho země. */
  const onSelectShape = (id: string) => {
    if (id === SECTIONS[indexRef.current].id) {
      if (id === "work") setZoomed((v) => !v);
      return;
    }
    selectContinent(id);
  };

  return (
    <div className="mm-viewport">
      <TopMenu lang={lang} index={index} onNavigate={navigate} onToggleLang={toggleLang} />

      {/* Planeta leží pod vším a je jen kulisa pro čtení — proto je pod textem
          a chytá tažení jen tam, kde nad ní text není. */}
      <div
        ref={stageRef}
        className={zoomed ? "mm-stage is-zoomed" : "mm-stage"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {size.w > 0 && (
          <Globe
            rotation={rotation}
            shapes={shapes}
            activeId={SECTIONS[index].id}
            onSelect={onSelectShape}
            width={size.w}
            height={size.h}
            radius={radius}
            ariaLabel={lang === "cs" ? "Planeta sekcí" : "Planet of sections"}
            regions={regions}
            activeRegionId={activeCountry}
            onSelectRegion={setActiveCountry}
          />
        )}
      </div>

      {/* Text nad planetou. Čitelnost je přednější než kouli — sloupec je rovný
          a scrolluje, i když se pod ním pevnina hýbe.
          aria-live: skutečná navigace neproběhne, změnu sekce musí ohlásit tenhle region. */}
      <div aria-live="polite" className="mm-reading">
        {SECTIONS.map((s, i) => (
          <section key={s.id} className="mm-stack-panel" hidden={i !== index} inert={i !== index}>
            {s.id === "home" && <HomePanel lang={lang} onNavigate={navigate} />}
            {s.id === "work" && (
              <WorkPanel
                lang={lang}
                zoomed={zoomed}
                activeCountryId={activeCountry}
                onSelectCountry={setActiveCountry}
                onToggleZoom={() => setZoomed((v) => !v)}
              />
            )}
            {s.id === "ideas" && <IdeasPanel lang={lang} />}
            {s.id === "contact" && <ContactPanel lang={lang} />}
          </section>
        ))}
      </div>
    </div>
  );
}
