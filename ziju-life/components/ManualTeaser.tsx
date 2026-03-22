"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ManualTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">

        {/* Levý box — citát */}
        <div className="flex flex-col justify-between gap-8 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-lg bg-white/80 backdrop-blur">
          <p className="text-3xl md:text-4xl font-extrabold text-foreground leading-snug tracking-tight">
            Hledal jsem smysl života. A zjistil jsem, že se nehledá — že se tvoří. Každý den. Každým rozhodnutím. Ale abych ho tvořil tak, jak chci já, musel jsem nejdřív vědět, na čem mi záleží. Tak vznikl můj kompas — a dneska pomáhám ostatním nastavit ten jejich.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-5xl leading-none">🧭</span>
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">Tvůj kompas</p>
              <p className="text-sm text-foreground/55 leading-snug">Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš jít.</p>
            </div>
          </div>
        </div>

        {/* Pravý box — detail + CTA */}
        <div className="flex flex-col gap-5 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-md bg-white/60 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">🧭</span>
            <p className="text-base font-bold text-foreground">Tvůj kompas</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-foreground/80 leading-relaxed">Tohle není o motivaci ani disciplíně.</p>
            <p className="text-sm text-foreground/55 leading-relaxed">Je to o tom, že jsem nikdy pořádně nepřestal a nezeptal se sám sebe — kde vlastně jsem a kam chci jít. Přesně na to je Tvůj kompas.</p>
          </div>
          <p className="text-sm text-foreground/65 leading-relaxed">Sedm strukturovaných kroků — od kola života přes hodnoty, vizi a překážky až po akční plán. Ke každému kroku jsou cvičení a šablony. Na konci si vygeneruješ vlastní dokument.</p>
          <ul className="space-y-1.5">
            {[
              "Vyzkoušel/a jsi pár cest, ale v ničem ses nenašel/nenašla.",
              "Máš v hlavě chaos a potřebuješ si to srovnat.",
              "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/55">
                <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent/50" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">
            <Link
              href="/tvuj-kompas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md"
            >
              Začít zdarma <ArrowRight size={15} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
