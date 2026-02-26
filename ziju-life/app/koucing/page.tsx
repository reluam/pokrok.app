"use client";

import DecorativeShapes from "@/components/DecorativeShapes";
import LeadForm from "@/components/LeadForm";
import RevealSection from "@/components/RevealSection";

export default function KoucingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero ve stylu homepage – skleněný bílý box (bez obrázku) */}
      <section className="relative flex items-center justify-center pt-24 pb-12 overflow-hidden paper-texture -mt-4 md:-mt-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto relative z-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 glass-grain">
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
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur glass-grain">
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
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur glass-grain">
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
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur glass-grain">
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
              <div className="bg-white/85 rounded-[24px] p-8 md:p-10 border border-white/60 shadow-md hover:shadow-xl transition-all flex flex-col h-full backdrop-blur glass-grain">
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
              <div className="bg-white/85 rounded-[24px] p-8 border border-white/60 shadow-md hover:shadow-xl transition-all backdrop-blur glass-grain">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Žádné manuály
                </h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Budeme spolu řešit tvoji unikátní situaci.
                </p>
              </div>

              <div className="bg-white/85 rounded-[24px] p-8 border border-white/60 shadow-md hover:shadow-xl transition-all backdrop-blur glass-grain">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Fokus na akci
                </h3>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Najdeme konkrétní kroky, jak vzít život zpátky do tvých rukou.
                </p>
              </div>

              <div className="bg-white/85 rounded-[24px] p-8 border border-white/60 shadow-md hover:shadow-xl transition-all backdrop-blur glass-grain">
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

      {/* Rezervace: ve stejném boxu jako na HP */}
      <RevealSection>
        <section id="rezervace" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/60 shadow-xl backdrop-blur-xl backdrop-saturate-150 glass-grain px-4 py-8 md:px-10 md:py-10 max-w-4xl mx-auto">
              <div className="relative space-y-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center">
                  Zarezervuj si 30 minutové sezení zdarma
                </h2>
                <p className="text-lg text-foreground/80 leading-relaxed text-center max-w-3xl mx-auto">
                  Velmi si cením, že zvažuješ, že půjdeš do koučování se mnou. Protože si zatím nemůžeš
                  ověřit mou kvalitu recenzemi, nabízím ti zvýhodněnou cenu 500 Kč za koučovací hodinu po
                  úvodním sezení zdarma. Platí pro první 3 měsíce koučování.
                </p>
                <div className="bg-white/90 rounded-2xl p-6 md:p-8 border border-black/5 max-w-xl mx-auto">
                  <p className="text-foreground/70 text-center mb-6">
                    Vyplňte krátce údaje a poté si vyberte termín v kalendáři.
                  </p>
                  <LeadForm source="koucing" compact />
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>
    </main>
  );
}
