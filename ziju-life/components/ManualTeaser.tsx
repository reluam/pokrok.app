"use client";

import Link from "next/link";

const tools = [
  {
    emoji: "🧭",
    name: "Kompas",
    desc: "Zmapuj kde jsi, na čem ti záleží a kam chceš jít. Sedm kroků — na konci máš vlastní dokument.",
    tag: "7 kroků",
    iconBg: "rgba(78,205,196,0.15)",
    tagBg: "rgba(78,205,196,0.15)",
    tagColor: "#2a9d95",
  },
  {
    emoji: "⭐",
    name: "Hodnoty",
    desc: "Pojmenuj, na čem ti opravdu záleží. Když to víš, rozhodování se zřídka stává jednodušším.",
    tag: "Cvičení",
    iconBg: "rgba(176,167,245,0.2)",
    tagBg: "rgba(176,167,245,0.2)",
    tagColor: "#7b6fcf",
  },
  {
    emoji: "⏱️",
    name: "Denní rituály",
    desc: "Nastav si strukturu dne, která ti dává energii místo toho, aby ti ji brala.",
    tag: "Průvodce",
    iconBg: "rgba(255,217,102,0.25)",
    tagBg: "rgba(255,217,102,0.25)",
    tagColor: "#a07c00",
  },
];

const bullets = [
  "Víš, jak chceš žít, ale nedokážeš s tím začít.",
  "Zkoušel/a jsi knížky, appky, frameworky — ale nic ti nevydrželo.",
  "Máš pocit, že ostatní to zvládají přirozeně — jen ty ne.",
];

export default function ManualTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 rounded-[36px] border border-black/6 shadow-lg overflow-hidden bg-white/80 backdrop-blur">

          {/* Levý sloupec */}
          <div className="flex flex-col justify-between gap-8 px-8 py-10 md:px-12 md:py-14 lg:border-r border-black/6">
            <div className="flex flex-col gap-6">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                Laboratoř
              </h2>

              <p className="text-base text-foreground/65 leading-relaxed">
                Tady najdeš to, co jsem objevil — jako interaktivní nástroje a cvičení, které ti pomůžou žít vědoměji. Projdeš jimi sám, ve svém tempu, a na konci každého víš o sobě víc než předtím.
              </p>

              <div>
                <p className="text-sm font-semibold text-foreground/45 mb-3">Pro tebe, pokud:</p>
                <ul className="space-y-2.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-accent/50 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                      </span>
                      <span className="text-sm text-foreground/70 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <Link
                href="/laborator"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md"
              >
                Vstup do laboratoře →
              </Link>
            </div>
          </div>

          {/* Pravý sloupec — kartičky nástrojů */}
          <div className="flex flex-col justify-center gap-3 px-8 py-10 md:px-10 md:py-14">
            {tools.map((t) => (
              <div
                key={t.name}
                className="flex items-start gap-4 rounded-2xl px-5 py-4 border border-black/5 bg-white/60"
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: t.iconBg }}
                >
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm mb-0.5">{t.name}</p>
                  <p className="text-sm text-foreground/55 leading-relaxed mb-2">{t.desc}</p>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: t.tagBg, color: t.tagColor }}
                  >
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
