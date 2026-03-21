"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

function FlipCard({
  quote,
  emoji,
  title,
  quick,
  lead,
  body,
  detail,
  bullets,
  cta,
  href,
}: {
  quote: string;
  emoji: string;
  title: string;
  quick: string;
  lead?: string;
  body?: string;
  detail: string;
  bullets?: string[];
  cta: string;
  href: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="min-h-[420px]"
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
        {/* Přední strana */}
        <div
          style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className="flex flex-col justify-between gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-lg bg-white/80 backdrop-blur select-none"
        >
          <p className="text-xl md:text-2xl font-extrabold text-foreground leading-snug tracking-tight">
            „{quote}"
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{emoji}</span>
            <div>
              <p className="text-base font-bold text-foreground leading-tight">{title}</p>
              <p className="text-sm text-foreground/55 leading-snug">{quick}</p>
            </div>
          </div>
        </div>

        {/* Zadní strana */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            inset: 0,
          }}
          className="flex flex-col gap-5 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-md bg-white/60 backdrop-blur select-none overflow-auto"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{emoji}</span>
            <p className="text-base font-bold text-foreground">{title}</p>
          </div>
          {lead && (
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-foreground/80 leading-relaxed">{lead}</p>
              {body && <p className="text-sm text-foreground/55 leading-relaxed">{body}</p>}
            </div>
          )}
          <p className="text-sm text-foreground/65 leading-relaxed">{detail}</p>
          {bullets && bullets.length > 0 && (
            <ul className="space-y-1.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/55">
                  <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent/50" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto pt-2">
            <Link
              href={href}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              {cta} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManualTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5 lg:gap-6">
        <FlipCard
          quote="Zkoušel jsem různé věci. Přečetl si knihy. Měl plány. A přesto jsem nevěděl, co vlastně chci."
          emoji="🗺️"
          title="Tvoje mapa"
          quick="Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš jít."
          lead="Tohle není o motivaci ani disciplíně."
          body="Je to o tom, že jsem nikdy pořádně nepřestal a nezeptal se sám sebe — kde vlastně jsem a kam chci jít. Přesně na to je Tvoje mapa."
          detail="Sedm strukturovaných kroků — od kola života přes hodnoty, vizi a překážky až po akční plán. Ke každému kroku jsou cvičení a šablony. Na konci si vygeneruješ vlastní dokument."
          bullets={[
            "Vyzkoušel/a jsi pár cest, ale v ničem ses nenašel/nenašla.",
            "Máš v hlavě chaos a potřebuješ si to srovnat.",
            "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
          ]}
          cta="Začít zdarma"
          href="/tvoje-mapa"
        />
        <FlipCard
          quote="Nemůžeš naplánovat svůj život jednou a provždy. Ale můžeš si nastavit kompas."
          emoji="📖"
          title="Můj kompas"
          quick="Matějův osobní soubor principů, hodnot a lekcí."
          lead="Principy a hodnoty nejsou dogma."
          body="Jsou to nástroje. Pomůžou ti dělat lepší rozhodnutí, i když nemáš všechny odpovědi. Takhle to funguje u mě — a proto jsem sepsal svůj kompas."
          detail="16 principů ve třech kategoriích — Základ (fyzická mašinérie), Principy (jak přemýšlet) a Pilulky (hořké pravdy). Každý princip je okomentovaný a doplněný tipy a zdroji."
          cta="Prozkoumat"
          href="/muj-kompas"
        />
      </div>
    </section>
  );
}
