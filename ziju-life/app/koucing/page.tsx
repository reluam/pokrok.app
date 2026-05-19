import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import HandDrawnCard from "@/components/HandDrawnCard";
import HandDrawnIcon from "@/components/HandDrawnIcon";

export const metadata: Metadata = {
  title: "Koučink: Cesta k vnitřnímu klidu | Žiju life",
  description:
    "Koučink pro lidi, kteří mají všechno — kromě klidu. Společně zpomalíme a najdeme způsob, jak žít vědomě.",
};

const steps = [
  {
    n: "1",
    emoji: "🔍",
    title: "Zastavení — Kde teď jsi",
    text:
      "Zpomalíme. Podíváme se na to, jak žiješ — kariéra, vztahy, zdraví, energie, smysl. Najdeme, kde se ti klid ztrácí a co tě nejvíc vyčerpává.",
  },
  {
    n: "2",
    emoji: "🧭",
    title: "Kořeny — Hodnoty a filozofie",
    text:
      "Zjistíme, čím se opravdu řídíš — i když si to neuvědomuješ. A nastavíme principy, ze kterých můžeš dál žít vědomě.",
  },
  {
    n: "3",
    emoji: "🌿",
    title: "Praxe — Konkrétní cvičení",
    text:
      "Stavíme každodenní praxi pro vnitřní klid. Meditace, journaling, stoická cvičení, vědomé pauzy. Začínáme jednoduše — to, co je v praxi udržitelné.",
  },
  {
    n: "4",
    emoji: "✨",
    title: "Přítomnost — Žít to",
    text:
      "Po pár měsících začínáš žít jinak. Ne proto, že jsi přidal další systém, ale proto, že jsi začal být víc sám sebou. Klid přestává být cíl a stává se způsobem bytí.",
  },
];

const packages = [
  {
    label: "Krátký sprint",
    count: "3",
    unit: "sezení",
    desc: "Pro konkrétní situaci nebo rozhodnutí.",
  },
  {
    label: "Hloubková práce",
    count: "10",
    unit: "sezení",
    desc: "Pro skutečnou změnu — od porozumění po nový způsob života.",
  },
  {
    label: "Celý rok",
    count: "∞",
    unit: "průběžně",
    desc: "Pro práci na tom, co přichází. Týden za týdnem.",
  },
];

export default function KoucingPage() {
  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      {/* ─── 1. HERO ─── */}
      <section className="relative bg-[#F8EEDB] pt-36 md:pt-48 pb-20 md:pb-24 -mt-20 animate-fade-up overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Cesta k <span className="underline-sketch inline-block pb-3">vnitřnímu klidu</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Koučink pro lidi, kteří mají všechno &mdash; kromě klidu. Společně zpomalíme a najdeme způsob, jak žít vědomě.
            </p>
            <div className="pt-2">
              <Link href="#rezervace" className="btn-playful text-lg" data-shape="3">
                Konzultace zdarma &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-16 md:h-20"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,22 C260,24 440,150 720,162 C1000,170 1180,26 1440,18 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-16 md:pb-20">
        {/* ─── 2. NENÍ PRO KAŽDÉHO ─── */}
        <section
          className="pt-16 md:pt-20 mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-8">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Než začneme
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Koučink není <span className="underline-playful">pro každého</span>.
            </h2>
          </div>

          <div className="max-w-3xl mx-auto text-center space-y-5 text-lg text-foreground/80 leading-relaxed">
            <p>
              Je to hluboká práce. Pro lidi, kteří jsou připraveni zpomalit a podívat se na sebe upřímně. Pokud hledáš motivační řeči nebo rychlou opravu, jsme každý jinde.
            </p>
            <p>
              Pokud hledáš vlastní tempo, koukni do{" "}
              <Link href="/knihovna" className="text-primary font-semibold hover:opacity-80 transition-opacity">
                knihovny
              </Link>
              . Ale jestli hledáš někoho, kdo ti pomůže žít život vědoměji a s klidem, jsi tady správně.
            </p>
          </div>
        </section>

        {/* ─── 3. MŮJ PŘÍSTUP ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "150ms" }}
        >
          <div className="text-center mb-8">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Můj přístup
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Klid jako <span className="underline-teal">priorita</span>.
            </h2>
          </div>

          <HandDrawnCard
            variant={0}
            shadow={false}
            stroke="#171717"
            strokeWidth={1.5}
            innerClassName="px-10 md:px-16 py-14 md:py-20 space-y-5"
          >
            <p className="text-lg text-foreground/80 leading-relaxed">
              Většina (západního) světa žije na opačném konci spektra klidu. Efektivita, produktivita, výkon, optimalizace. Vnitřní klid je v lepším případě bonus &mdash; v horším překážka.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Já to vidím jinak. <span className="underline-playful font-semibold">Vnitřní klid není odměna</span> za to, že vše zvládáš. Je to základ, ze kterého můžeš vše dělat. Bez něj jsou všechny systémy, návyky a strategie jen způsoby, jak rychleji vyhořet.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              V mé praxi čerpám z buddhismu, stoicismu, meditace, journalingu a minimalismu. Ne jako z dogmat &mdash; ale jako z nástrojů, které fungují. Sám je každodenně používám. A v koučinku ti pomůžu najít tvoji vlastní kombinaci.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Není to o tom přidat další věci do tvého života. Je to o tom některé{" "}
              <span className="underline-teal font-semibold">ubrat</span> &mdash; a u zbytku být víc přítomný.
            </p>
          </HandDrawnCard>
        </section>

        {/* ─── 4. JAK TO FUNGUJE ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Jak to funguje
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Čtyři <span className="underline-playful">kroky</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((step, i) => {
              const rotations = [
                "rotate-[-0.6deg]",
                "rotate-[0.5deg]",
                "rotate-[-0.4deg]",
                "rotate-[0.6deg]",
              ];
              return (
                <HandDrawnCard
                  key={step.n}
                  variant={i}
                  className={`group ${rotations[i % 4]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                  innerClassName="p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <HandDrawnIcon bg="#ffe4cc" variant={i} size={36}>
                      <span className="font-display font-bold text-sm">{step.n}</span>
                    </HandDrawnIcon>
                    <h3 className="font-display text-xl font-extrabold flex-1">{step.title}</h3>
                    <HandDrawnIcon bg="#ffe4cc" variant={i} size={44} shape="square">
                      <span className="text-xl">{step.emoji}</span>
                    </HandDrawnIcon>
                  </div>
                  <p className="text-foreground/70 leading-relaxed text-[0.95rem]">{step.text}</p>
                </HandDrawnCard>
              );
            })}
          </div>
        </section>
      </div>

      {/* ─── 5. CITÁT — full-bleed cream band ─── */}
      <section
        className="relative bg-[#F8EEDB] py-20 md:py-28 overflow-hidden animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        {/* Top wave */}
        <svg
          aria-hidden="true"
          className="absolute top-0 left-0 w-full h-16 md:h-20 rotate-180"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,22 C260,24 440,150 720,162 C1000,170 1180,26 1440,18 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>

        <div className="relative max-w-3xl mx-auto text-center px-6 md:px-12">
          <p className="font-display italic text-2xl md:text-4xl font-extrabold leading-snug text-foreground/85">
            Klid není odměna za to, že vše zvládáš. Je to{" "}
            <span className="underline-teal">základ</span>, ze kterého teprve můžeš zvládat.
          </p>
        </div>

        {/* Bottom wave */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-16 md:h-20"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,22 C260,24 440,150 720,162 C1000,170 1180,26 1440,18 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-20 pb-16 md:pb-20">
        {/* ─── 6. FORMÁT A CENA ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Prakticky
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Jak to vypadá <span className="underline-playful">v praxi</span>.
            </h2>
            <p className="text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
              Sezení probíhají online (Google). Trvají 60 minut. Mezi sezeními pracuješ s tím, co spolu nastavíme &mdash; ale bez tlaku, vlastním tempem.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {packages.map((opt, i) => {
              const rotations = ["rotate-[-0.5deg]", "rotate-[0.4deg]", "rotate-[-0.3deg]"];
              return (
                <HandDrawnCard
                  key={opt.label}
                  variant={i}
                  shadow={false}
                  fill="#FFF4EB"
                  stroke="rgba(23,23,23,0.3)"
                  strokeWidth={1.25}
                  className={`group ${rotations[i]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                  innerClassName="p-5 space-y-2"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-2xl font-extrabold text-primary leading-none">
                      {opt.count}
                    </span>
                    <span className="text-xs text-muted">{opt.unit}</span>
                  </div>
                  <p className="font-display font-extrabold text-base text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted leading-relaxed">{opt.desc}</p>
                </HandDrawnCard>
              );
            })}
          </div>

          {/* Cena */}
          <div className="relative">
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1200 180"
              preserveAspectRatio="none"
            >
              <path
                d="M 20 10 Q 300 6 600 12 Q 900 18 1180 10 Q 1194 90 1180 170 Q 900 174 600 168 Q 300 162 20 170 Q 6 90 20 10 Z"
                fill="#E8FAF8"
              />
            </svg>
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1200 180"
              preserveAspectRatio="none"
            >
              <path
                d="M 20 10 Q 300 6 600 12 Q 900 18 1180 10 Q 1194 90 1180 170 Q 900 174 600 168 Q 300 162 20 170 Q 6 90 20 10 Z"
                fill="none"
                stroke="rgba(23,23,23,0.3)"
                strokeWidth="1.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="relative px-6 py-5 space-y-1.5">
              <p className="text-sm font-display font-extrabold text-[#2ba89e]">
                Pro prvních 10 klientů zvýhodněně
              </p>
              <p className="text-sm text-foreground/75">
                Jedno sezení za <span className="font-semibold text-foreground">1 800 Kč</span>{" "}
                <span className="line-through text-foreground/35">3 000 Kč</span> &mdash; při deseti a více sezeních pak{" "}
                <span className="font-semibold text-foreground">1 500 Kč</span>{" "}
                <span className="line-through text-foreground/35">2 500 Kč</span> za sezení. Rozsah domluvíme na konzultaci.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 7. REZERVACE ─── */}
        <section className="animate-fade-up" style={{ animationDelay: "500ms" }}>
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#2ba89e] font-bold mb-2">
              Začneme tím nejjednodušším
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Pojďme se nejdřív <span className="underline-teal">potkat</span>.
            </h2>
            <p className="text-muted mt-4 max-w-xl mx-auto leading-relaxed">
              30 minut zdarma. Projdeme tvoji situaci a zjistíme, jestli ti vůbec mohu pomoct. Bez tlaku, bez závazku.
            </p>
          </div>

          <div id="rezervace" className="relative scroll-mt-24">
            <HandDrawnCard
              variant={1}
              shadow={false}
              stroke="#171717"
              strokeWidth={1.5}
              innerClassName="px-10 md:px-16 py-14 md:py-20"
            >
              <span className="badge-soon absolute -top-3 left-1/2 -translate-x-1/2 !bg-[#c6f1ec] !text-[#2ba89e] !rotate-0 shadow-sm z-10">
                Zdarma &bull; bez závazku
              </span>

              <div className="flex flex-col md:flex-row md:gap-10 gap-8">
                <div className="flex-1 md:pr-4 space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-display text-2xl md:text-3xl font-extrabold">
                      Co tě <span className="underline-teal">čeká</span>
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      "30 minut online jeden na jednoho",
                      "Projdeme tvoji situaci bez příkras",
                      "Zjistíme, jestli a jak mohu pomoct",
                      "Žádný závazek ani tlak",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 border-[#2ba89e]/40 flex items-center justify-center mt-0.5">
                          <span className="text-[#2ba89e] font-bold text-xs">&#10003;</span>
                        </span>
                        <span className="text-base text-foreground/85">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notebook spine — hidden on mobile */}
                <div className="hidden md:flex items-stretch" aria-hidden="true">
                  <svg className="h-full w-3" viewBox="0 0 12 400" preserveAspectRatio="none">
                    <path
                      d="M 6 4 Q 5 100 7 200 Q 5 300 6 396"
                      fill="none"
                      stroke="rgba(23,23,23,0.25)"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                <div className="flex-1 md:pl-4 flex flex-col justify-center space-y-2">
                  <LeadForm
                    source="koucing_konzultace"
                    compact
                    preferredKind="free"
                    preferredMeetingTypeId="intro_free"
                    lockMeetingType
                    submitLabel="Zarezervovat konzultaci zdarma"
                  />
                  <p className="text-[11px] text-muted text-center">
                    Po odeslání si vybereš termín v kalendáři.
                  </p>
                </div>
              </div>
            </HandDrawnCard>
          </div>
        </section>
      </div>
    </main>
  );
}
