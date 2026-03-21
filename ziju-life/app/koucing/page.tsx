"use client";

import Link from "next/link";
import DecorativeShapes from "@/components/DecorativeShapes";
import LeadForm from "@/components/LeadForm";
import RevealSection from "@/components/RevealSection";

export default function KoucingPage() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen">

      {/* HERO */}
      <section className="relative flex items-center justify-center pt-24 pb-12 overflow-hidden paper-texture -mt-4 md:-mt-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto relative z-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150">
              <DecorativeShapes variant="hero" />
              <div className="relative px-4 sm:px-8 py-10 md:py-14">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl leading-tight text-foreground font-bold">
                    Upřímně: možná koučink vůbec nepotřebuješ.
                  </h1>
                  <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                    Na Žiju.life najdeš{" "}
                    <a href="/inspirace" className="text-accent hover:opacity-80 transition-opacity">inspiraci</a>,{" "}
                    <a href="/tvoje-mapa" className="text-accent hover:opacity-80 transition-opacity">cvičení</a>{" "}
                    i{" "}
                    <a href="/muj-kompas" className="text-accent hover:opacity-80 transition-opacity">průvodce</a>{" "}
                    pro vytvoření svého vlastního manuálu pro život.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => scrollTo("zdroje")}
                      className="px-8 py-4 bg-white border-2 border-accent text-accent rounded-full text-lg font-semibold hover:bg-accent/5 transition-colors shadow-md"
                    >
                      Zdroje zdarma
                    </button>
                    <button
                      onClick={() => scrollTo("jak-to-funguje")}
                      className="px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
                    >
                      O koučingu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VOLNÉ ZDROJE */}
      <RevealSection>
        <section id="zdroje" className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <DecorativeShapes position="left" />
          <div className="max-w-4xl mx-auto space-y-10 relative z-10">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Začni tady — je to zdarma
              </h2>
              <p className="text-lg text-foreground/65 max-w-2xl mx-auto leading-relaxed">
                Připravil jsem tři místa, kde se můžeš ponořit do tématu smysluplného života na vlastní pěst. Mnoho lidí zjistí, že jim to stačí.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  href: "/jak-zit",
                  label: "Jak žít?",
                  icon: "🧭",
                  desc: "Základní otázky o směru, hodnotách a tom, co vlastně od života chceš. Dobrý začátek pro každého.",
                },
                {
                  href: "/tvoje-mapa",
                  label: "Tvoje mapa",
                  icon: "🗺️",
                  desc: "Sedm zastávek od 'kde jsem' po 'žiju podle sebe'. Ke každé najdeš cvičení, šablony a materiály.",
                },
                {
                  href: "/inspirace",
                  label: "Inspirace",
                  icon: "✨",
                  desc: "Knihy, podcasty, články a nápady, které mě formovaly a možná budou užitečné i pro tebe.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col gap-4 bg-white/85 rounded-[24px] p-7 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-1">{item.label}</p>
                    <p className="text-sm text-foreground/65 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent mt-auto">Prozkoumat →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* PRO KOHO JE KOUČINK */}
      <RevealSection>
        <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Poznáváš se v tom?
              </h2>
            </div>

            <div className="bg-white/85 rounded-[28px] border border-white/60 shadow-md backdrop-blur p-8 md:p-10 space-y-6">
              <ul className="space-y-3">
                {[
                  "Vyzkoušel/a jsi pár věcí, ale v ničem ses nenašel/nenašla.",
                  "Máš pocit, že všichni kolem vědí, co chtějí — jen ty ne.",
                  "Žiješ hodně v hlavě a neumíš to přetavit do akce.",
                  "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                      <span className="text-accent font-bold text-xs">→</span>
                    </span>
                    <span className="text-base text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xl text-foreground/80 leading-relaxed">
                Koučink není o dalších informacích. Je o tom, dostat se pod povrch — zjistit, co tě drží tam, kde jsi, a co konkrétně potřebuješ změnit. Pak pracovat na akci, ne jen na pochopení.
              </p>
              <p className="text-base text-foreground/65 leading-relaxed">
                Pracuju vždy na konkrétní životní oblasti: kariéra, finance, zdraví, vztahy, přátelství, osobní rozvoj, volný čas nebo smysl. Jdeme do hloubky a pak se soustředíme výhradně na konkrétní kroky dopředu.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => scrollTo("rezervace")}
                  className="px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
                >
                  Sednout si na konzultaci →
                </button>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* JAK TO FUNGUJE */}
      <RevealSection>
        <section id="jak-to-funguje" className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Jak koučink funguje
              </h2>
            </div>
            <div className="space-y-5">
              {[
                {
                  n: "1",
                  title: "Kde opravdu jsi",
                  text: "Začneme tím, co se skutečně děje — ne co by se dít mělo. Podíváme se na tvoji situaci bez příkras, aby bylo jasné, s čím vlastně pracujeme.",
                },
                {
                  n: "2",
                  title: "Co tě drží",
                  text: "Většinou to není to, co si myslíš. Pod povrchem bývá vzorec, přesvědčení nebo strach, který tiše řídí tvoje rozhodnutí. Tohle je ta těžší, ale důležitější část.",
                },
                {
                  n: "3",
                  title: "Akce, ne záměry",
                  text: "Pochopení nestačí. Každé sezení končí konkrétním krokem — ne obecným předsevzetím, ale jasnou akcí na tento týden.",
                },
              ].map((item) => (
                <div key={item.n} className="flex gap-5 bg-white/85 rounded-[24px] p-7 border border-white/60 shadow-md backdrop-blur">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-base">
                    {item.n}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-base text-foreground/75 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* KONZULTACE + BALÍČKY */}
      <RevealSection>
        <section id="rezervace" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <DecorativeShapes position="right" />
          <div className="max-w-3xl mx-auto relative z-10 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Pojďme se nejdřív potkat
              </h2>
              <p className="text-lg text-foreground/60 max-w-xl mx-auto">
                Na 30 minutách zjistíme, co tě trápí, jaké jsou možnosti — a hlavně jestli ti vůbec mohu pomoct. Bez tlaku, bez závazku.
              </p>
            </div>

            {/* Konzultace box */}
            <div className="rounded-[28px] border-2 border-accent/40 bg-white/90 shadow-xl backdrop-blur-xl backdrop-saturate-150 px-8 py-10 space-y-7 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">Zdarma</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Nezávazná konzultace</h3>
                <p className="text-foreground/65 leading-relaxed">
                  30 minut, kde si projdeme tvoji situaci a zjistíme, jestli a jak ti mohu pomoct. Pokud smysl nedává, řekneme si to rovnou.
                </p>
              </div>

              <div className="text-4xl font-extrabold text-accent">Zdarma</div>

              <ul className="space-y-2">
                {[
                  "30 minut jeden na jednoho",
                  "Projdeme tvoji situaci bez příkras",
                  "Zjistíme, jestli a jak mohu pomoct",
                  "Žádný závazek ani tlak",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                      <span className="text-accent font-bold text-xs">✓</span>
                    </span>
                    <span className="text-base text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <LeadForm
                  source="koucing_konzultace"
                  compact
                  preferredKind="free"
                  preferredMeetingTypeId="intro_free"
                  lockMeetingType
                  submitLabel="Zarezervovat konzultaci zdarma"
                />
                <p className="text-[11px] text-foreground/50 text-center">
                  Nejprve vyplníš údaje, hned poté si vybereš termín.
                </p>
              </div>
            </div>

            {/* Koučinkové možnosti */}
            <div className="rounded-[24px] border border-white/60 bg-white/70 backdrop-blur shadow-md px-8 py-8 space-y-5">
              <h3 className="text-xl font-bold text-foreground">Jak koučink vypadá dál?</h3>
              <p className="text-base text-foreground/65 leading-relaxed">
                Pokud se po konzultaci rozhodneme pokračovat, pracujeme vždy na jedné konkrétní životní oblasti — do hloubky. Každé sezení má jasný výstup a konkrétní kroky k akci.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                {[
                  { label: "Krátký sprint", desc: "3 sezení na konkrétní problém nebo rozhodnutí." },
                  { label: "Hloubková práce", desc: "10 sezení na jednu životní oblast — od základů po změnu." },
                  { label: "Celý rok", desc: "Průběžná práce na tom, co přichází — týden za týdnem." },
                ].map((opt) => (
                  <div key={opt.label} className="rounded-xl bg-accent/5 border border-accent/15 p-4 space-y-1">
                    <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                    <p className="text-xs text-foreground/60 leading-relaxed">{opt.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-foreground/50 pt-1">
                Jedno sezení začíná na <span className="font-semibold text-foreground/70">3 000 Kč</span> — při deseti a více sezeních pak platí <span className="font-semibold text-foreground/70">2 500 Kč</span> za sezení. Rozsah domluvíme na konzultaci.
              </p>
            </div>

          </div>
        </section>
      </RevealSection>

    </main>
  );
}
