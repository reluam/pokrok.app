"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ManualTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">

        {/* Levý box — citát */}
        <div className="flex flex-col justify-between gap-8 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-lg bg-white/80 backdrop-blur">
          <p className="text-xl md:text-2xl font-bold text-foreground leading-snug">
            Osobní rozvoj není o čtení dalších knih ani sledování dalších videí. Je o tom, že si sednete a opravdu to prožijete. Každý nástroj v laboratoři je postavený tak, abyste si z něj odnesli konkrétní výstup — ne jen dobré pocity.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-5xl leading-none">🧪</span>
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">Laboratoř</p>
              <p className="text-sm text-foreground/55 leading-snug">Interaktivní nástroje, testy a cvičení pro osobní rozvoj — vše na jednom místě.</p>
            </div>
          </div>
        </div>

        {/* Pravý box — detail + CTA */}
        <div className="flex flex-col gap-5 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-md bg-white/60 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">🧪</span>
            <p className="text-base font-bold text-foreground">Laboratoř</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-foreground/80 leading-relaxed">Víc než obsah — jsou to zážitky, ze kterých něco vzejde.</p>
            <p className="text-sm text-foreground/55 leading-relaxed">Laboratoř je místo, kde si věci opravdu vyzkoušíte. Interaktivní cvičení, testy a strukturované nástroje — každý navržený tak, abyste si odnesli konkrétní výstup.</p>
          </div>
          <ul className="space-y-1.5">
            {[
              "Tvůj kompas — zmapuj kde jsi a naplánuj kam chceš jít.",
              "Moje hodnoty — pojmenuj co ti opravdu záleží.",
              "Další nástroje průběžně přibývají.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/55">
                <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent/50" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">
            <Link
              href="/laborator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md"
            >
              Vstoupit do laboratoře <ArrowRight size={15} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
