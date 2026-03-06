"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DecorativeShapes from "@/components/DecorativeShapes";
import LeadForm from "@/components/LeadForm";
import RevealSection from "@/components/RevealSection";

export default function KoucingPage() {
  const [pathChoice, setPathChoice] = useState<"audit" | "free" | null>(null);
  const [auditPromoRemaining, setAuditPromoRemaining] = useState<number | null>(null);
  const auditPromoTotal = 20;

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await fetch("/api/booking/audit-promo-stats");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.remaining === "number") {
          setAuditPromoRemaining(data.remaining);
        }
      } catch {
        // ignore
      }
    };
    fetchPromo();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero ve stylu homepage – skleněný bílý box (bez obrázku) */}
      <section className="relative flex items-center justify-center pt-24 pb-12 overflow-hidden paper-texture -mt-4 md:-mt-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto relative z-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150">
              <DecorativeShapes variant="hero" />

              <div className="relative px-4 sm:px-8 py-10 md:py-14">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl leading-tight text-foreground font-bold">
                    Zarezervuj si sezení zdarma a vezmi si{" "}
                    <span className="hand-drawn-underline">svůj život</span> zpět.
                  </h1>
                  <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                    Nebudu tě učit, jak máš žít. Pomůžu ti rozklíčovat tvé automatické reakce a najít
                    cestu, jak vědomě přepsat programy, které tě doposud řídily.
                  </p>
                  <button
                    onClick={() => {
                      const element = document.getElementById("rezervace");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
                  >
                    Chci změnu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Poznáváš se v tom? */}
      <RevealSection>
        <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <DecorativeShapes position="left" />
          <div className="max-w-6xl mx-auto space-y-12 relative z-10">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                Poznáváš se v tom?
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
              {/* Box 1 */}
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold text-xl">✓</span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                  Máš všechno, co bys „měl" mít, ale cítíš, že ti život protéká mezi prsty.
                </p>
              </div>

              {/* Box 2 */}
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold text-xl">✓</span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                  Umíš si skvěle zorganizovat čas, ale večer jsi absolutně bez energie.
                </p>
              </div>

              {/* Box 3 */}
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold text-xl">✓</span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                  Tvůj den neřídíš ty, ale požadavky ostatních a skryté strachy.
                </p>
              </div>

              {/* Box 4 */}
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold text-xl">✓</span>
                  </div>
                </div>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                  Víš, že potřebuješ změnu, ale vůbec netušíš, kde začít.
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Jak to u mě vypadá? */}
      <RevealSection>
        <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Jak to u mě vypadá?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/85 rounded-[24px] p-8 border border-white/60 shadow-md hover:shadow-xl transition-all backdrop-blur">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Žádné manuály
                </h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Budeme spolu řešit tvoji unikátní situaci.
                </p>
              </div>

              <div className="bg-white/85 rounded-[24px] p-8 border border-white/60 shadow-md hover:shadow-xl transition-all backdrop-blur">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Fokus na akci
                </h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Najdeme konkrétní kroky, jak vzít život zpátky do tvých rukou.
                </p>
              </div>

              <div className="bg-white/85 rounded-[24px] p-8 border border-white/60 shadow-md hover:shadow-xl transition-all backdrop-blur">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Hravost i v těžkých věcech
                </h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  I vážná témata se dají probrat bez toho, abychom ztratili radost ze života.
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* 3 kroky k úspěchu: – pod Jak to u mě vypadá */}
      <RevealSection>
        <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                3 kroky k úspěchu:
              </h2>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                1
              </span>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Přijetí reality</h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Pro smysluplnou změnu musíme znát naši výchozí pozici. A náš mozek má tendenci nám
                  realitu zkreslovat.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                2
              </span>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Hledání cesty</h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Každý si musíme najít tu svou cestu. Což znamená sjet z té hlavní dálnice, po které
                  jdou všichni.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                3
              </span>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Žijem life</h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Když už víme kudy, tak se můžeme vydat na cestu. Místy to bude těžké, ale věřím, že
                  ty výhledy stojí za to.
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Rezervace: dvě cesty stejně jako na HP – šedý box jen pro text */}
      <RevealSection>
        <section id="rezervace" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center max-w-3xl mx-auto">
                Zarezervuj si koučingové sezení, kde projdeme, jak můžeš začít žít život více podle sebe.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto items-start">
                {/* Audit karta */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPathChoice("audit")}
                    className="group text-left rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 hover:shadow-2xl hover:-translate-y-2 transition-all px-5 py-5 flex flex-col gap-4 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg md:text-xl font-semibold text-foreground">
                        Audit života (90 min)
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm md:text-base text-foreground/85">
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>Jasná mapa tvojí situace</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>Priority, kam dávat energii</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>Konkrétní první kroky do praxe</span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <div className="w-full py-3 px-5 bg-accent text-white font-bold text-center text-sm md:text-base rounded-full group-hover:bg-accent-hover transition-colors">
                        Chci audit života
                      </div>
                    </div>
                  </button>
                  <p className="text-xs md:text-sm text-foreground/70 px-1">
                    Pro prvních {auditPromoTotal} lidí nabízím zvýhodněnou cenu{" "}
                    <strong>900 Kč za 90 minut auditu života</strong>.
                    <br />
                    Zbývá:{" "}
                    <strong>
                      {auditPromoRemaining !== null
                        ? Math.max(auditPromoRemaining, 0)
                        : auditPromoTotal}{" "}
                      / {auditPromoTotal}
                    </strong>{" "}
                    míst.
                  </p>
                </div>

                {/* Free konzultace karta */}
                <button
                  type="button"
                  onClick={() => setPathChoice("free")}
                  className="group text-left rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 hover:shadow-2xl hover:-translate-y-2 transition-all px-5 py-5 flex flex-col gap-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground/80">
                      20min konzultace zdarma
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm md:text-base text-foreground/70">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/20" />
                      <span>Rychlá ochutnávka koučingu</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/20" />
                      <span>Bez závazku, jen 20 minut</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/20" />
                      <span>Rozhodneš se, jestli pokračovat</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <div className="w-full py-3 px-5 bg-black/[0.03] text-foreground font-semibold text-center text-sm md:text-base rounded-full border border-black/10 transition-colors group-hover:bg-black/10 group-hover:border-black/40">
                      Ještě se rozmýšlím
                    </div>
                  </div>
                </button>
              </div>

              {pathChoice && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-8">
                  <div className="w-full max-w-md md:max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 p-5 md:p-7 relative">
                    <button
                      type="button"
                      onClick={() => setPathChoice(null)}
                      className="absolute right-4 top-4 text-foreground/50 hover:text-foreground text-sm"
                      aria-label="Zavřít"
                    >
                      Zavřít
                    </button>
                    <div className="space-y-4 pt-2">
                      <h3 className="text-lg md:text-xl font-semibold text-foreground text-center">
                        {pathChoice === "audit"
                          ? "Nejprve vyplň své údaje"
                          : "Nejprve vyplň své údaje"}
                      </h3>
                      <p className="text-foreground/70 text-center mb-2">
                        {pathChoice === "audit"
                          ? "Vyplň své údaje a vyber si termín 90min auditu života."
                          : "Vyplň své údaje a vyber si termín 20min konzultace zdarma."}
                      </p>
                      <LeadForm
                        source={pathChoice === "audit" ? "koucing_audit" : "koucing_free"}
                        compact
                        preferredKind={pathChoice === "audit" ? "paid" : "free"}
                        preferredMeetingTypeId={pathChoice === "audit" ? "coaching_paid" : "intro_free"}
                        lockMeetingType
                        onSuccess={() => setPathChoice(null)}
                      />
                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-center gap-5 md:gap-6 text-[11px] md:text-xs text-foreground/60">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-accent" />
                          <span>Krok 1: Údaje</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-70">
                          <span className="flex h-2.5 w-2.5 rounded-full border border-accent/40" />
                          <span>Krok 2: Výběr termínu</span>
                        </div>
                        {pathChoice === "audit" && (
                          <div className="flex items-center gap-2 opacity-70">
                            <span className="flex h-2.5 w-2.5 rounded-full border border-accent/40" />
                            <span>Krok 3: Platba</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </RevealSection>
    </main>
  );
}
