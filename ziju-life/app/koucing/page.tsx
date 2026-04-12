"use client";

import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export default function KoucingPage() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-28 md:pt-32 pb-16 md:pb-20">

        {/* ─── Hero ─── */}
        <section className="mb-16 md:mb-20 animate-fade-up relative">
          <div className="absolute -top-4 -left-2 text-3xl animate-float opacity-60 hidden md:block">
            🧭
          </div>

          <div className="paper-card p-8 md:p-12 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Upřímně: možná koučing vůbec{" "}
                <span className="underline-playful">nepotřebuješ.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
                Na Žiju.life najdeš{" "}
                <Link href="/knihovna" className="text-primary font-semibold hover:opacity-80 transition-opacity">Knihovnu</Link>{" "}
                plnou knih, videí a tipů zdarma. Koučing je pro chvíle, kdy chceš jít hlouběji — s někým po boku.
              </p>
              <button
                onClick={() => scrollTo("rezervace")}
                className="btn-playful text-lg"
              >
                Rezervovat konzultaci zdarma
              </button>
            </div>
          </div>
        </section>

        {/* ─── Pro koho ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              A co když jsi už hodně přečetl — a <span className="underline-teal">pořád hledáš</span>?
            </h2>
          </div>

          <div className="paper-card p-8 md:p-10 space-y-6">
            <div className="space-y-3">
              {[
                "Víš, jak chceš, aby tvůj život vypadal, ale nedokážeš ho začít žít?",
                "Máš tisíc plánů v hlavě, ale ráno nevíš, kde začít?",
                "Žiješ víc v budoucnosti než v přítomnosti — a ta mezera tě paralyzuje?",
                "Zkoušel/a jsi plánovače, knížky, appky — a nic ti nevydrželo víc než týden?",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e8faf8] flex items-center justify-center mt-0.5">
                    <span className="text-[#2ba89e] font-bold text-xs">&rarr;</span>
                  </span>
                  <span className="text-base text-foreground/80">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-lg text-foreground/80 leading-relaxed">
              Koučing ti nepřidá další informace. Jde pod povrch — zjistí, co tě drží tam, kde jsi, a co konkrétně potřebuješ změnit. Pak pracujeme na akci, ne jen na pochopení.
            </p>
            <p className="text-base text-muted leading-relaxed">
              Nedívám se na jednu izolovanou oblast — dívám se na tvůj život jako celek. Kariéra, vztahy, zdraví, energie, smysl — všechno se vzájemně ovlivňuje. Společně hledáme tu správnou kombinaci věcí, která ti začne dávat smysl.
            </p>
            <button
              onClick={() => scrollTo("rezervace")}
              className="btn-playful"
            >
              Sednout si na konzultaci &rarr;
            </button>
          </div>
        </section>

        {/* ─── Jak to funguje ─── */}
        <section
          id="jak-to-funguje"
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Proces
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Jak to <span className="underline-playful">funguje</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "1",
                emoji: "🔍",
                title: "Kde opravdu jsi",
                text: "Začneme tím, co se skutečně děje — ne co by se dít mělo. Podíváme se na tvoji situaci bez příkras, aby bylo jasné, s čím pracujeme.",
              },
              {
                n: "2",
                emoji: "🔗",
                title: "Co tě drží",
                text: "Většinou to není to, co si myslíš. Pod povrchem bývá vzorec, přesvědčení nebo strach, který tiše řídí tvoje rozhodnutí.",
              },
              {
                n: "3",
                emoji: "🚀",
                title: "Akce, ne záměry",
                text: "Pochopení nestačí. Každé sezení končí konkrétním krokem — ne obecným předsevzetím, ale jasnou akcí na tento týden.",
              },
            ].map((item) => (
              <div key={item.n} className="paper-card p-6 text-center relative">
                <span className="absolute top-4 left-5 w-7 h-7 rounded-full bg-surface-low flex items-center justify-center text-muted font-display font-bold text-sm">
                  {item.n}
                </span>
                <span className="text-3xl block mb-4 mt-2">{item.emoji}</span>
                <h3 className="font-display text-xl font-extrabold mb-3">{item.title}</h3>
                <p className="text-foreground/60 leading-relaxed text-[0.95rem]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Konzultace + balíčky ─── */}
        <section
          id="rezervace"
          className="scroll-mt-24 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#2ba89e] font-bold mb-2">
              Začni tady
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Pojďme se nejdřív <span className="underline-teal">potkat</span>
            </h2>
            <p className="text-muted mt-3 max-w-xl mx-auto">
              Na 30 minutách zjistíme, co tě trápí, jaké jsou možnosti — a hlavně jestli ti vůbec mohu pomoct. Bez tlaku, bez závazku.
            </p>
          </div>

          {/* Konzultace box */}
          <div className="paper-card p-8 md:p-10 mb-6 relative">
            <span className="badge-soon absolute -top-2.5 left-1/2 -translate-x-1/2 !bg-[#c6f1ec] !text-[#2ba89e] !rotate-0">
              Zdarma
            </span>

            <div className="space-y-2 mb-7">
              <h3 className="font-display text-2xl font-extrabold">Nezávazná konzultace</h3>
              <p className="text-muted leading-relaxed">
                30 minut, během kterých projdeme tvoji situaci a zjistíme, jestli a jak ti mohu pomoct. Pokud to smysl nedává, řekneme si to rovnou.
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:gap-10 gap-8">
              {/* Left: bullets */}
              <div className="flex-1 space-y-5">
                <div className="font-display text-4xl font-extrabold text-primary">Zdarma</div>

                <div className="space-y-2">
                  {[
                    "30 minut jeden na jednoho",
                    "Projdeme tvoji situaci bez příkras",
                    "Zjistíme, jestli a jak mohu pomoct",
                    "Žádný závazek ani tlak",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e8faf8] flex items-center justify-center mt-0.5">
                        <span className="text-[#2ba89e] font-bold text-xs">&#10003;</span>
                      </span>
                      <span className="text-base text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
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
                <p className="text-[11px] text-muted text-center">
                  Nejprve vyplníš údaje, hned poté si vybereš termín.
                </p>
              </div>
            </div>
          </div>

          {/* Pokračování */}
          <div className="paper-card p-8 space-y-5">
            <h3 className="font-display text-xl font-extrabold">Jak to vypadá dál?</h3>
            <p className="text-muted leading-relaxed">
              Pokud se po konzultaci rozhodneme pokračovat, díváme se na tvůj život jako na celek — a pracujeme na tom, co je právě teď nejdůležitější. Každé sezení má jasný výstup a konkrétní kroky k akci.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-1">
              {[
                { label: "Krátký sprint", desc: "3 sezení na konkrétní problém nebo rozhodnutí." },
                { label: "Hloubková práce", desc: "10 sezení na proměnu toho, jak žiješ — od porozumění po reálnou změnu." },
                { label: "Celý rok", desc: "Průběžná práce na tom, co přichází — týden za týdnem." },
              ].map((opt) => (
                <div key={opt.label} className="rounded-xl bg-[#fff4eb] border border-[#ffb380]/30 p-4 space-y-1">
                  <p className="font-display font-extrabold text-sm text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#e8faf8] border border-[#8be0d8]/30 p-4 mt-1 space-y-1.5">
              <p className="text-sm font-display font-extrabold text-[#2ba89e]">Pro prvních 10 klientů — zvýhodněná cena výměnou za hodnocení</p>
              <p className="text-sm text-muted">
                Jedno sezení za <span className="font-semibold text-foreground/70">1 800 Kč</span> <span className="line-through text-foreground/35">3 000 Kč</span> — při deseti a více sezeních pak <span className="font-semibold text-foreground/70">1 500 Kč</span> <span className="line-through text-foreground/35">2 500 Kč</span> za sezení. Rozsah domluvíme na konzultaci.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
