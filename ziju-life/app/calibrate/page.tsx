export const dynamic = "force-static";

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

        {/* ─── Jak to funguje ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "100ms" }}
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

        {/* ─── CTA ─── */}
        <section
          className="text-center animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="paper-card p-8">
            <p className="text-2xl mb-3">⚙️</p>
            <h3 className="font-display text-xl font-extrabold mb-2">
              Calibrate je v přípravě
            </h3>
            <p className="text-muted text-sm mb-5 max-w-md mx-auto">
              Appka ještě není venku, ale pracuju na ní každý den. Pokud chceš vědět, až bude ready, zaregistruj se pro Beta verzi.
            </p>
            <a href="mailto:matej@ziju.life" className="btn-playful">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
              Chci Beta verzi
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
