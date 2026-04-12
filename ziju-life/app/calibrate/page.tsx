import Link from "next/link";

export const dynamic = "force-static";

const exerciseTypes = [
  {
    emoji: "🔍",
    name: "Rozpoznej model",
    desc: "Dostaneš příběh, identifikuješ který model v něm hraje roli.",
  },
  {
    emoji: "🔮",
    name: "Předpověď",
    desc: "\"Co se stane když...?\" — a pak odhalení skutečného výsledku z historie.",
  },
  {
    emoji: "🔄",
    name: "Flip it",
    desc: "Aplikuj inverzi na problém, přeformuluj otázku z opačné strany.",
  },
  {
    emoji: "⚔️",
    name: "Clash",
    desc: "Dva modely si protiřečí — rozhodni, který má v dané situaci větší váhu.",
  },
  {
    emoji: "🐛",
    name: "Debug",
    desc: "Najdi kognitivní zkreslení ukryté ve scénáři.",
  },
];

const lenses = [
  { emoji: "🎯", name: "Rozhodování", examples: "First principles, inverze, Occam's razor" },
  { emoji: "🔗", name: "Systémy", examples: "Feedback loops, emergence, bottlenecks" },
  { emoji: "🧠", name: "Lidské chování", examples: "Incentives, loss aversion, social proof" },
  { emoji: "⏳", name: "Čas a nejistota", examples: "Second-order thinking, reversibilita, margin of safety" },
  { emoji: "♟️", name: "Strategie", examples: "Opportunity cost, leverage, asymmetric upside" },
];

export default function CalibratePage() {
  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-28 md:pt-32 pb-16 md:pb-20">

        {/* ─── Hero ─── */}
        <section className="mb-16 md:mb-20 animate-fade-up relative text-center">
          <div className="absolute -top-4 right-8 text-3xl animate-float opacity-60 hidden md:block">
            ⚙️
          </div>

          <span className="badge-soon mb-6 inline-flex">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            </svg>
            Právě tvořím
          </span>

          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1] mb-6 tracking-tight">
            <span className="underline-playful">Calibrate</span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto mb-4">
            Duolingo pro mentální modely — appka, která tě každý den naučí lépe myslet, rozhodovat se a chápat svět kolem sebe.
          </p>

          <p className="text-base text-muted max-w-xl mx-auto">
            5 minut denně. Žádné dlouhé čtení — rovnou akce.
          </p>
        </section>

        {/* ─── Problém ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="paper-card p-8 md:p-10">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-4">
              Proč <span className="underline-playful">Calibrate</span>?
            </h2>
            <p className="text-foreground/70 leading-relaxed text-lg mb-4">
              Lidé čtou knihy od Kahnemana, Clear, Harariho, Parrisha — ale za týden zapomenou 90 % toho, co přečetli.
            </p>
            <p className="text-foreground/70 leading-relaxed text-lg mb-4">
              Vědí o mentálních modelech, ale neumí je použít v reálném životě. Chybí jim praxe, opakování a zpětná vazba.
            </p>
            <p className="text-foreground/80 leading-relaxed text-lg font-semibold">
              Nikdo jim nedá &ldquo;tělocvičnu na myšlení.&rdquo; Calibrate to mění.
            </p>
          </div>
        </section>

        {/* ─── Jak to funguje ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Denní lekce
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Jak to <span className="underline-playful">funguje</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="paper-card p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ffe4cc] flex items-center justify-center mb-4 text-2xl">
                💡
              </div>
              <h3 className="font-display text-xl font-extrabold mb-2">Intro</h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem]">
                Krátké vysvětlení modelu — animace, příběh, vizuál. Například: &ldquo;Second-order thinking: Co se stane potom?&rdquo;
              </p>
            </div>

            <div className="paper-card p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#c6f1ec] flex items-center justify-center mb-4 text-2xl">
                🎬
              </div>
              <h3 className="font-display text-xl font-extrabold mb-2">Scénář</h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem]">
                Reálná situace. Vybíráš z odpovědí, řadíš priority, spojuješ příčiny a důsledky. Žádná teorie — praxe.
              </p>
            </div>

            <div className="paper-card p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#dfd8fa] flex items-center justify-center mb-4 text-2xl">
                🦎
              </div>
              <h3 className="font-display text-xl font-extrabold mb-2">Zpětná vazba</h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem]">
                Ne správná/špatná, ale silnější/slabší — protože myšlení není binární. Chameleon ti vysvětlí proč.
              </p>
            </div>

            <div className="paper-card p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#fff4eb] flex items-center justify-center mb-4 text-2xl">
                🔁
              </div>
              <h3 className="font-display text-xl font-extrabold mb-2">Spaced retrieval</h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem]">
                Modely z minulých dní se vracejí v nových kontextech. Inverze z pondělí se ve čtvrtek objeví v úplně jiném scénáři.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Typy cvičení ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#2ba89e] font-bold mb-2">
              Variace
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Typy <span className="underline-teal">cvičení</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exerciseTypes.map((ex) => (
              <div key={ex.name} className="paper-card p-5 flex gap-4 items-start">
                <span className="text-2xl shrink-0">{ex.emoji}</span>
                <div>
                  <h3 className="font-display text-base font-extrabold mb-1">{ex.name}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{ex.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Lenses (Skill tree) ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#7766d8] font-bold mb-2">
              Skill tree
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Pět <span className="underline-playful">čoček</span>
            </h2>
            <p className="text-muted mt-3 max-w-lg mx-auto">
              Každá čočka je disciplína. Postupně odemykáš nové modely a pokročilé scénáře.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lenses.map((lens) => (
              <div key={lens.name} className="paper-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{lens.emoji}</span>
                  <h3 className="font-display text-lg font-extrabold">{lens.name}</h3>
                </div>
                <p className="text-foreground/50 text-sm">{lens.examples}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Gamifikace ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          <div className="paper-card p-8 md:p-10">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-6">
              Motivace bez <span className="underline-teal">bullshitu</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4 items-start">
                <span className="text-2xl shrink-0">🔥</span>
                <div>
                  <h3 className="font-display font-extrabold mb-1">Streak</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    Ne kvůli číslu — ale &ldquo;kolik dní v řadě jsi vědomě kalibroval myšlení.&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-2xl shrink-0">🎯</span>
                <div>
                  <h3 className="font-display font-extrabold mb-1">Calibration score</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    Ne body, ale skóre přesnosti tvého úsudku. Zlepšuje se postupně.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-2xl shrink-0">🦎</span>
                <div>
                  <h3 className="font-display font-extrabold mb-1">Chameleon evoluce</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    Tvůj maskot mění barvy a vzory podle toho, kolik čoček ovládáš.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-2xl shrink-0">💬</span>
                <div>
                  <h3 className="font-display font-extrabold mb-1">Denní insight</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    Po každé lekci jedna věta, kterou si můžeš odnést do dne.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section
          className="text-center animate-fade-up"
          style={{ animationDelay: "600ms" }}
        >
          <div className="paper-card p-8">
            <p className="text-2xl mb-3">⚙️</p>
            <h3 className="font-display text-xl font-extrabold mb-2">
              Calibrate je v přípravě
            </h3>
            <p className="text-muted text-sm mb-5 max-w-md mx-auto">
              Appka ještě není venku, ale pracuju na ní každý den. Pokud chceš vědět, až bude ready, napiš mi.
            </p>
            <a href="mailto:matej@ziju.life" className="btn-playful">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
              Dej mi vědět &rarr;
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
