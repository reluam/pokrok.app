"use client";

import DecorativeShapes from "@/components/DecorativeShapes";

export default function KoucingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Sekce */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden paper-texture">
        <DecorativeShapes variant="hero" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground">
            Zarezervuj si sezení zdarma a vezmi si <span className="hand-drawn-underline">svůj život</span> zpět.
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Nebudu tě učit, jak máš žít. Pomůžu ti rozklíčovat tvé automatické reakce a najít cestu, jak vědomě přepsat programy, které tě doposud řídily.
          </p>
          
          <button
            onClick={() => {
              const element = document.getElementById('rezervace');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Chci změnu
          </button>
        </div>
      </section>

      {/* Pro koho to je? - Prominentní sekce */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white/50">
        <DecorativeShapes position="left" />
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
              Poznáváš se v tom?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* Box 1 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Tvůj den neřídíš ty, ale požadavky ostatních a skryté strachy.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Máš všechno, co bys „měl" mít, ale cítíš, že ti život protéká mezi prsty.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Tvá vlastní mysl je tvůj největší kritik, ne spojenec.
              </p>
            </div>

            {/* Box 4 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-lg hover:shadow-xl flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-xl">✓</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium flex-1">
                Vidíš, jak reaguješ, ale neumíš to změnit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jak to u mě vypadá? */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Jak to u mě vypadá?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Žádné manuály
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Budeme spolu řešit tvoji unikátní situaci.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Fokus na akci
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Najdeme konkrétní kroky, jak vzít život zpátky do tvých rukou.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
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

      {/* Cena */}
      <section id="rezervace" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
              Zarezervuj si 30 minutové sezení zdarma
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-foreground/80 leading-relaxed text-center">
                Velmi si cením, že zvažuješ, že půjdeš do koučování se mnou. Protože si zatím nemůžeš ověřit mou kvalitu recenzemi, nabízím ti zvýhodněnou cenu 500 Kč za koučovací hodinu po úvodním sezení zdarma. Platí pro první 3 měsíce koučování.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/10">
            <div className="rounded-lg overflow-hidden">
              <iframe 
                src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ09WuK7w9SPU0bBC_TuRCmstTwkzazkPtq65gVaPDejfHspyAXwj1RKisdDRFE_Q2PF6a6iZviE?gv=true" 
                style={{ border: 0 }} 
                width="100%" 
                height="600" 
                frameBorder="0"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
