"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

// Každá karta má 2 stránky: rychlý přehled + detail.
// Navigace je lineární přes všech 6 slidů.
const SLIDES = [
  {
    card: 0, type: "quick",
    emoji: "🗺️", title: "Tvoje mapa",
    text: "Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš. Interaktivní průvodce zdarma.",
    cta: "Začít zdarma", href: "/tvoje-mapa", primary: true,
  },
  {
    card: 0, type: "detail",
    emoji: "🗺️", title: "Tvoje mapa",
    text: "Sedm strukturovaných kroků — od kola života přes hodnoty, vizi a překážky až po akční plán. Ke každému kroku jsou cvičení a šablony. Na konci si vygeneruješ vlastní dokument.",
    bullets: [
      "Vyzkoušel/a jsi pár cest, ale v ničem ses nenašel/nenašla.",
      "Máš v hlavě chaos a potřebuješ si to srovnat.",
      "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
    ],
    cta: "Začít zdarma", href: "/tvoje-mapa", primary: true,
  },
  {
    card: 1, type: "quick",
    emoji: "📖", title: "Můj kompas",
    text: "Matějův osobní soubor principů, hodnot a lekcí. Inspirace pro tvůj vlastní kompas.",
    cta: "Prozkoumat", href: "/muj-kompas", primary: false,
  },
  {
    card: 1, type: "detail",
    emoji: "📖", title: "Můj kompas",
    text: "16 principů ve třech kategoriích — Základ (fyzická mašinérie), Principy (jak přemýšlet) a Pilulky (hořké pravdy). Každý princip je okomentovaný a doplněný tipy a zdroji. Není to dogma — je to inspirace.",
    cta: "Prozkoumat", href: "/muj-kompas", primary: false,
  },
  {
    card: 2, type: "quick",
    emoji: "✨", title: "Inspirace",
    text: "Knihy, podcasty, články a nápady, které mě formovaly a můžou být užitečné i pro tebe.",
    cta: "Prozkoumat", href: "/inspirace", primary: false,
  },
  {
    card: 2, type: "detail",
    emoji: "✨", title: "Inspirace",
    text: "Knihy, videa, reelsky a články, které Matěje formovaly. Roztříděné do kategorií — od osobního rozvoje přes zdraví po mindset. Průběžně doplňováno.",
    cta: "Prozkoumat", href: "/inspirace", primary: false,
  },
] as const;

export default function ManualTeaser() {
  const [slide, setSlide] = useState(0);
  const total = SLIDES.length;
  const current = SLIDES[slide];

  const prev = () => setSlide((s) => (s - 1 + total) % total);
  const next = () => setSlide((s) => (s + 1) % total);

  const bullets = "bullets" in current ? (current.bullets as readonly string[]) : undefined;

  return (
    <section className="relative py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative">

          {/* Karta */}
          <div
            key={slide}
            className={`rounded-[28px] border-2 px-8 py-10 md:px-12 md:py-12 flex flex-col gap-6 transition-all duration-300 ${
              current.primary
                ? "bg-accent/5 border-accent/25"
                : "bg-white/85 border-white/60 backdrop-blur"
            } shadow-md`}
          >
            {/* Badge: rychlý / detail */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground/30">
                {current.type === "quick" ? "Přehled" : "Více info"}
              </span>
              <span className="text-xs text-foreground/30">
                {current.card + 1} / 3 · {current.type === "quick" ? "1" : "2"} ze 2
              </span>
            </div>

            {/* Obsah */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="text-5xl leading-none flex-shrink-0">{current.emoji}</span>
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug">
                    {current.title}
                  </h3>
                </div>
              </div>

              <p className="text-base md:text-lg text-foreground/70 leading-relaxed">
                {current.text}
              </p>

              {bullets && bullets.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/65">
                      <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/60" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <Link
                href={current.href}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg ${
                  current.primary
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-foreground text-white hover:opacity-90"
                }`}
              >
                {current.cta} <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Šipky */}
          <button
            onClick={prev}
            aria-label="Předchozí"
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-black/10 shadow-md flex items-center justify-center hover:shadow-lg hover:border-accent/30 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Další"
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-black/10 shadow-md flex items-center justify-center hover:shadow-lg hover:border-accent/30 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dots — 3 páry */}
        <div className="flex justify-center gap-2 mt-5">
          {[0, 1, 2].map((card) => {
            const isActiveCard = current.card === card;
            const isDetail = isActiveCard && current.type === "detail";
            return (
              <div key={card} className="flex gap-1">
                <button
                  onClick={() => setSlide(card * 2)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActiveCard && !isDetail ? "bg-accent w-4" : "bg-black/20"
                  }`}
                  aria-label={`Karta ${card + 1} přehled`}
                />
                <button
                  onClick={() => setSlide(card * 2 + 1)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    isDetail ? "bg-accent w-4" : "bg-black/10"
                  }`}
                  aria-label={`Karta ${card + 1} detail`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
