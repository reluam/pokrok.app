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
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-[#FDFDF7]/80 shadow-xl backdrop-blur-xl backdrop-saturate-150">
              <DecorativeShapes variant="hero" />
              <div className="relative px-4 sm:px-8 py-10 md:py-14">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl leading-tight text-foreground font-bold">
                    Upřímně: možná koučing vůbec nepotřebuješ.
                  </h1>
                  <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                    Na Žiju.life najdeš{" "}
                    <Link href="/knihovna" className="text-accent hover:opacity-80 transition-opacity">Knihovnu</Link>{" "}
                    plnou novinek, tipů a inspirací a{" "}
                    <Link href="/laborator" className="text-accent hover:opacity-80 transition-opacity">Laboratoř</Link>{" "}
                    s interaktivními cvičeními a AI pomocníkem pro každodenní život.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/knihovna"
                      className="px-8 py-4 bg-white border-2 border-accent text-accent rounded-full text-lg font-semibold hover:bg-accent/5 transition-colors shadow-md"
                    >
                      Knihovna zdarma
                    </Link>
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

      {/* KNIHOVNA + LABORATOŘ */}
      <RevealSection>
        <section id="zdroje" className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <DecorativeShapes position="left" />
          <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Knihovna */}
            <Link
              href="/knihovna"
              className="group flex flex-col items-center gap-4 bg-white/85 rounded-[28px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur text-center"
            >
              <span className="text-5xl">📚</span>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
                  Knihovna — zdarma
                </h2>
                <p className="text-base text-foreground/65 leading-relaxed">
                  Knihy, videa, výzkumy a tipy o vědomém žití. Bez poplatku, bez registrace. Začni tady.
                </p>
                <span className="inline-block text-sm font-semibold text-accent mt-1">Prozkoumat knihovnu →</span>
              </div>
            </Link>

            {/* Laboratoř */}
            <Link
              href="/laborator"
              className="group flex flex-col items-center gap-4 bg-white/85 rounded-[28px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur text-center"
            >
              <span className="text-5xl">🧪</span>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
                  Laboratoř — 490 Kč/rok
                </h2>
                <p className="text-base text-foreground/65 leading-relaxed">
                  Interaktivní cvičení, doprovodná aplikace pro každodenní život a AI průvodce, který ti ukáže nové perspektivy. Méně než 1 káva měsíčně.
                </p>
                <span className="inline-block text-sm font-semibold text-accent mt-1">Vstoupit do laboratoře →</span>
              </div>
            </Link>
          </div>
        </section>
      </RevealSection>

      {/* BRIDGE + PRO KOHO JE KOUČINK */}
      <RevealSection>
        <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                A co když jsi už hodně přečetl, hodně vyzkoušel — a pořád hledáš?
              </h2>
            </div>

            <div className="bg-white/85 rounded-[28px] border border-white/60 shadow-md backdrop-blur p-8 md:p-10 space-y-6">
              <ul className="space-y-3">
                {[
                  "Víš, jak chceš, aby tvůj život vypadal, ale nedokážeš ho začít žít.",
                  "Máš tisíc plánů v hlavě, ale ráno nevíš, kde začít.",
                  "Žiješ víc v budoucnosti než v přítomnosti — a ta mezera tě paralyzuje.",
                  "Zkoušel/a jsi plánovače, knížky, appky — a nic ti nevydrželo víc než týden.",
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
                Koučing ti nepřidá další informace. Jde pod povrch — zjistí, co tě drží tam, kde jsi, a co konkrétně potřebuješ změnit. Pak pracujeme na akci, ne jen na pochopení.
              </p>
              <p className="text-base text-foreground/65 leading-relaxed">
                Nedívám se na jednu izolovanou oblast — dívám se na tvůj život jako celek. Kariéra, vztahy, zdraví, energie, smysl — všechno se vzájemně ovlivňuje. Společně hledáme tu správnou kombinaci věcí, která ti začne dávat smysl. A pak ji krok za krokem přetavíme do reality.
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
                Jak to funguje
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

            {/* Možnosti pokračování */}
            <div className="rounded-[24px] border border-white/60 bg-white/70 backdrop-blur shadow-md px-8 py-8 space-y-5">
              <h3 className="text-xl font-bold text-foreground">Jak to vypadá dál?</h3>
              <p className="text-base text-foreground/65 leading-relaxed">
                Pokud se po konzultaci rozhodneme pokračovat, díváme se na tvůj život jako na celek — a pracujeme na tom, co je právě teď nejdůležitější. Každé sezení má jasný výstup a konkrétní kroky k akci.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                {[
                  { label: "Krátký sprint", desc: "3 sezení na konkrétní problém nebo rozhodnutí." },
                  { label: "Hloubková práce", desc: "10 sezení na proměnu toho, jak žiješ — od porozumění po reálnou změnu." },
                  { label: "Celý rok", desc: "Průběžná práce na tom, co přichází — týden za týdnem." },
                ].map((opt) => (
                  <div key={opt.label} className="rounded-xl bg-accent/5 border border-accent/15 p-4 space-y-1">
                    <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                    <p className="text-xs text-foreground/60 leading-relaxed">{opt.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-accent/5 border border-accent/15 p-4 mt-1 space-y-1.5">
                <p className="text-sm font-semibold text-accent">Pro prvních 10 klientů — zvýhodněná cena výměnou za hodnocení</p>
                <p className="text-sm text-foreground/50">
                  Jedno sezení za <span className="font-semibold text-foreground/70">1 800 Kč</span> <span className="line-through text-foreground/35">3 000 Kč</span> — při deseti a více sezeních pak <span className="font-semibold text-foreground/70">1 500 Kč</span> <span className="line-through text-foreground/35">2 500 Kč</span> za sezení. Rozsah domluvíme na konzultaci.
                </p>
              </div>
            </div>

          </div>
        </section>
      </RevealSection>

    </main>
  );
}
