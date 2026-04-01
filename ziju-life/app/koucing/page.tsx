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
      <section className="max-w-5xl mx-auto px-5 pt-6 pb-12">
        <div className="relative overflow-hidden rounded-[32px] border border-black/8 bg-[#fdf0e6]/50">
          <DecorativeShapes variant="hero" />
          <div className="relative px-8 md:px-16 py-14 md:py-20">
            <div className="max-w-3xl mx-auto text-center space-y-6">
                  <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight">
                    Upřímně: možná koučing vůbec nepotřebuješ.
                  </h1>
                  <p className="text-lg md:text-xl text-foreground/65 leading-relaxed max-w-2xl mx-auto">
                    Na Žiju.life najdeš{" "}
                    <Link href="/knihovna" className="text-accent hover:opacity-80 transition-opacity">Knihovnu</Link>{" "}
                    plnou knih, videí a tipů zdarma a{" "}
                    <Link href="/laborator" className="text-accent hover:opacity-80 transition-opacity">Laboratoř</Link>{" "}
                    s interaktivními cvičeními a AI průvodcem. Koučing je pro chvíle, kdy chceš jít hlouběji — s někým po boku.
                  </p>
                  <button
                    onClick={() => scrollTo("rezervace")}
                    className="px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
                  >
                    Rezervovat konzultaci zdarma
                  </button>
            </div>
          </div>
        </div>
      </section>

      {/* BRIDGE + PRO KOHO JE KOUČINK */}
      <RevealSection>
        <section className="max-w-5xl mx-auto px-5 py-16 md:py-20">
          <div className="space-y-8">
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
        <section id="jak-to-funguje" className="max-w-5xl mx-auto px-5 py-16 md:py-20">
          <div className="space-y-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground text-center">
              Jak to funguje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  n: "1",
                  title: "Kde opravdu jsi",
                  text: "Začneme tím, co se skutečně děje — ne co by se dít mělo. Podíváme se na tvoji situaci bez příkras, aby bylo jasné, s čím vlastně pracujeme.",
                  icon: (
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                      {/* Lupa / hledání */}
                      <circle cx="34" cy="34" r="18" stroke="#d4873a" strokeWidth="3" fill="#fdf0e6" />
                      <line x1="47" y1="47" x2="62" y2="62" stroke="#d4873a" strokeWidth="4" strokeLinecap="round" />
                      {/* Oko uvnitř lupy */}
                      <ellipse cx="34" cy="34" rx="10" ry="6" stroke="#FF8C42" strokeWidth="2" fill="none" />
                      <circle cx="34" cy="34" r="3" fill="#FF8C42" />
                      <circle cx="35" cy="33" r="1" fill="white" />
                    </svg>
                  ),
                },
                {
                  n: "2",
                  title: "Co tě drží",
                  text: "Většinou to není to, co si myslíš. Pod povrchem bývá vzorec, přesvědčení nebo strach, který tiše řídí tvoje rozhodnutí. Tohle je ta těžší, ale důležitější část.",
                  icon: (
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                      {/* Řetěz / pouta */}
                      <ellipse cx="28" cy="40" rx="12" ry="8" stroke="#d4873a" strokeWidth="3" fill="#fdf0e6" />
                      <ellipse cx="44" cy="40" rx="12" ry="8" stroke="#d4873a" strokeWidth="3" fill="#fdf0e6" />
                      {/* Prasklina */}
                      <path d="M36 32 L36 48" stroke="#FF6B1A" strokeWidth="2" strokeDasharray="3 2" />
                      {/* Zámek */}
                      <rect x="52" y="18" width="18" height="14" rx="3" fill="#FF8C42" stroke="#d4873a" strokeWidth="2" />
                      <path d="M56 18 V13 Q61 6 66 13 V18" stroke="#d4873a" strokeWidth="2" fill="none" />
                      <circle cx="61" cy="24" r="2" fill="#fdf0e6" />
                    </svg>
                  ),
                },
                {
                  n: "3",
                  title: "Akce, ne záměry",
                  text: "Pochopení nestačí. Každé sezení končí konkrétním krokem — ne obecným předsevzetím, ale jasnou akcí na tento týden.",
                  icon: (
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                      {/* Raketa */}
                      <path d="M40 12 C40 12 28 30 28 48 L40 54 L52 48 C52 30 40 12 40 12Z" fill="#fdf0e6" stroke="#d4873a" strokeWidth="2.5" />
                      <circle cx="40" cy="32" r="5" fill="#FF8C42" />
                      <circle cx="40" cy="32" r="2" fill="white" />
                      {/* Křídla */}
                      <path d="M28 48 L20 50 L28 40" fill="#FF6B1A" stroke="#d4873a" strokeWidth="1.5" />
                      <path d="M52 48 L60 50 L52 40" fill="#FF6B1A" stroke="#d4873a" strokeWidth="1.5" />
                      {/* Plamen */}
                      <path d="M35 54 L37 64 L40 58 L43 64 L45 54" fill="#FFD966" stroke="#d4873a" strokeWidth="1.5" />
                      {/* Šipka doprava */}
                      <path d="M60 28 L72 22" stroke="#FF8C42" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M67 18 L72 22 L67 26" stroke="#FF8C42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.n} className="bg-white border border-black/8 rounded-[24px] px-6 py-8 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative">
                  {/* Číslo */}
                  <span className="absolute top-4 left-5 w-8 h-8 rounded-full bg-[#f5f0e6] flex items-center justify-center text-foreground/50 font-bold text-sm">
                    {item.n}
                  </span>
                  {/* Ilustrace */}
                  <div className="w-24 h-24">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-base text-foreground/60 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* KONZULTACE + BALÍČKY */}
      <RevealSection>
        <section id="rezervace" className="max-w-5xl mx-auto px-5 py-16 md:py-24 relative overflow-hidden">
          <DecorativeShapes position="right" />
          <div className="relative z-10 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Pojďme se nejdřív potkat
              </h2>
              <p className="text-lg text-foreground/60 max-w-xl mx-auto">
                Na 30 minutách zjistíme, co tě trápí, jaké jsou možnosti — a hlavně jestli ti vůbec mohu pomoct. Bez tlaku, bez závazku.
              </p>
            </div>

            {/* Konzultace box */}
            <div className="rounded-[28px] border-2 border-accent/40 bg-white/90 shadow-xl backdrop-blur-xl backdrop-saturate-150 px-8 py-10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">Zdarma</span>
              </div>

              <div className="space-y-2 mb-7">
                <h3 className="text-2xl font-bold text-foreground">Nezávazná konzultace</h3>
                <p className="text-foreground/65 leading-relaxed">
                  30 minut, kde si projdeme tvoji situaci a zjistíme, jestli a jak ti mohu pomoct. Pokud smysl nedává, řekneme si to rovnou.
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:gap-10 gap-8">
                {/* Left: Zdarma + bullet points */}
                <div className="flex-1 space-y-5">
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
                </div>

                {/* Right: form */}
                <div className="flex-1 flex flex-col justify-center space-y-2">
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
