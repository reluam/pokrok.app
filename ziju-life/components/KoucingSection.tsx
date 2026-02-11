"use client";

import DecorativeShapes from "./DecorativeShapes";

export default function KoucingSection() {
  return (
    <section id="koucing" className="scroll-mt-24 relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden paper-texture">
      <DecorativeShapes variant="hero" />
      <DecorativeShapes position="left" />
      <div className="max-w-6xl mx-auto space-y-16 md:space-y-20 relative z-10">
        {/* Nadpis a úvod */}
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground mb-6">
            Jak převzít <span className="hand-drawn-underline">řízení</span>?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Nebudu tě učit, jak máš žít. Pomůžu ti rozklíčovat tvé automatické
            reakce a najít cestu, jak vědomě přepsat programy, které tě doposud
            řídily.
          </p>
        </div>

        {/* Poznáváš se v tom? */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            Poznáváš se v tom?
          </h3>
          <ul className="space-y-4 list-disc list-inside text-lg md:text-xl text-foreground/90 leading-relaxed">
            <li>Tvůj den neřídíš ty, ale požadavky ostatních a skryté strachy.</li>
            <li>Máš všechno, co bys „měl" mít, ale cítíš, že ti život protéká mezi prsty.</li>
            <li>Tvá vlastní mysl je tvůj největší kritik, ne spojenec.</li>
            <li>Vidíš, jak reaguješ, ale neumíš to změnit.</li>
          </ul>
        </div>

        {/* Jak to u mě vypadá? */}
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Jak to u mě vypadá?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h4 className="text-xl font-bold text-foreground mb-4">
                Žádné manuály
              </h4>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Budeme spolu řešit tvoji unikátní situaci.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h4 className="text-xl font-bold text-foreground mb-4">
                Fokus na akci
              </h4>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Najdeme konkrétní kroky, jak vzít život zpátky do tvých rukou.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/30 transition-all">
              <h4 className="text-xl font-bold text-foreground mb-4">
                Hravost i v těžkých věcech
              </h4>
              <p className="text-lg text-foreground/80 leading-relaxed">
                I vážná témata se dají probrat bez toho, abychom ztratili radost
                ze života.
              </p>
            </div>
          </div>
        </div>

        {/* Rezervace */}
        <div id="rezervace" className="scroll-mt-24">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
            Zarezervuj si 30 minutové sezení zdarma
          </h3>
          <p className="text-lg text-foreground/80 leading-relaxed text-center max-w-3xl mx-auto mb-8">
            Velmi si cením, že zvažuješ, že půjdeš do koučování se mnou.
            Protože si zatím nemůžeš ověřit mou kvalitu recenzemi, nabízím ti
            zvýhodněnou cenu 500 Kč za koučovací hodinu po úvodním sezení
            zdarma. Platí pro první 3 měsíce koučování.
          </p>
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
      </div>
    </section>
  );
}
