"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

// ── Flip karta (přední: citát, zadní: detail) ─────────────────────────────────

function FlipCard({
  quote,
  lead,
  body,
  detail,
  bullets,
  reverse,
}: {
  quote: string;
  lead?: string;
  body?: string;
  detail: string;
  bullets?: string[];
  reverse?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`min-h-[460px] ${reverse ? "lg:order-2" : ""}`}
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "inherit",
        }}
      >
        {/* Přední strana: Citát */}
        <div
          style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className="flex flex-col justify-between gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-lg bg-white/80 backdrop-blur cursor-pointer select-none"
        >
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
            „{quote}"
          </h3>
          <p className="text-xs font-semibold text-foreground/35 tracking-wide">Přejeď pro více →</p>
        </div>

        {/* Zadní strana: Detail */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
          className="flex flex-col gap-5 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-md bg-white/60 backdrop-blur cursor-pointer select-none"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">Více info</p>
          {lead && (
            <div className="space-y-2">
              <p className="text-base font-bold text-foreground/85 leading-relaxed">{lead}</p>
              {body && <p className="text-sm text-foreground/60 leading-relaxed">{body}</p>}
            </div>
          )}
          <p className="text-sm text-foreground/70 leading-relaxed">{detail}</p>
          {bullets && bullets.length > 0 && (
            <ul className="space-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/60">
                  <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent/50" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Statický box: přehled + CTA ───────────────────────────────────────────────

function OverviewCard({
  emoji,
  title,
  quick,
  cta,
  href,
  reverse,
}: {
  emoji: string;
  title: string;
  quick: string;
  cta: string;
  href: string;
  reverse?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-lg bg-white/80 backdrop-blur ${reverse ? "lg:order-1" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">Přehled</p>
      <div className="space-y-4">
        <span className="text-6xl leading-none block">{emoji}</span>
        <h3 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{title}</h3>
        <p className="text-base md:text-lg text-foreground/65 leading-relaxed">{quick}</p>
      </div>
      <div className="mt-auto">
        <Link
          href={href}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-bold transition-all shadow-md hover:shadow-lg bg-accent text-white hover:bg-accent-hover"
        >
          {cta} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ManualTeaser() {
  return (
    <>
      {/* Sekce 1: Tvoje mapa */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5 lg:gap-6">
          <FlipCard
            quote="Zkoušel jsem různé věci. Přečetl si knihy. Měl plány. A přesto jsem nevěděl, co vlastně chci."
            lead="Tohle není o motivaci ani disciplíně."
            body="Je to o tom, že jsem nikdy pořádně nepřestal a nezeptal se sám sebe — kde vlastně jsem a kam chci jít. Přesně na to je Tvoje mapa."
            detail="Sedm strukturovaných kroků — od kola života přes hodnoty, vizi a překážky až po akční plán. Ke každému kroku jsou cvičení a šablony. Na konci si vygeneruješ vlastní dokument."
            bullets={[
              "Vyzkoušel/a jsi pár cest, ale v ničem ses nenašel/nenašla.",
              "Máš v hlavě chaos a potřebuješ si to srovnat.",
              "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
            ]}
          />
          <OverviewCard
            emoji="🗺️"
            title="Tvoje mapa"
            quick="Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš jít. Interaktivní průvodce zdarma."
            cta="Začít zdarma"
            href="/tvoje-mapa"
          />
        </div>
      </section>

      {/* Sekce 2: Můj kompas */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5 lg:gap-6">
          <OverviewCard
            emoji="📖"
            title="Můj kompas"
            quick="Matějův osobní soubor principů, hodnot a lekcí. Inspirace pro tvůj vlastní kompas."
            cta="Prozkoumat"
            href="/muj-kompas"
            reverse
          />
          <FlipCard
            quote="Nemůžeš naplánovat svůj život jednou a provždy. Ale můžeš si nastavit kompas."
            lead="Principy a hodnoty nejsou dogma."
            body="Jsou to nástroje. Pomůžou ti dělat lepší rozhodnutí, i když nemáš všechny odpovědi. Takhle to funguje u mě — a proto jsem sepsal svůj kompas."
            detail="16 principů ve třech kategoriích — Základ (fyzická mašinérie), Principy (jak přemýšlet) a Pilulky (hořké pravdy). Každý princip je okomentovaný a doplněný tipy a zdroji. Není to dogma — je to inspirace."
            reverse
          />
        </div>
      </section>
    </>
  );
}
