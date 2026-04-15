import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Koučink: Z hlavy do života | Žiju life",
  description:
    "Celý můj koučovací framework zdarma. Mindsety, cvičení, proces. A pokud to sám nezvládneš — jsem tu. Konzultace zdarma.",
};

const phases = [
  {
    n: "1",
    emoji: "🔍",
    title: "Audit — Kde opravdu jsi",
    text: "Zmapujeme tvoji aktuální situaci. Ne jenom to, co tě trápí, ale celý kontext — kariéra, vztahy, zdraví, energie, smysl. Protože věci spolu souvisí víc, než si myslíš. Identifikujeme tvůj cíl a hlavně konkrétní blokery — co přesně tě drží na místě. Většinou to nejsou vnější okolnosti, ale vzorce v hlavě.",
  },
  {
    n: "2",
    emoji: "🧭",
    title: "Základy — Hodnoty a mindsety",
    text: "Zmapujeme tvoje hodnoty a mindsety — čím se řídíš, i když si to neuvědomuješ. Pak definujeme, které mindsety potřebuješ, aby tě dovedly k cíli.",
  },
  {
    n: "3",
    emoji: "🚀",
    title: "Akce — Cvičení a návyky",
    text: "Lekci po lekci stavíme konkrétní návyky a cvičení, které rozbíjí staré vzorce. Začínáme jednoduše a postupně přidáváme. Nejde o revoluci přes noc — jde o malé kroky, které se sčítají.",
  },
  {
    n: "4",
    emoji: "✨",
    title: "Momentum — Nová trajektorie",
    text: "Po 10–15 sezeních začínáš vidět výsledky. Ne proto, že jsi našel zázračnou formuli, ale proto, že jsi 10–15 týdnů dělal vědomé kroky. V tuhle chvíli se rozhodneš: chceš pokračovat, nebo už jdeš sám. Obojí je v pořádku.",
  },
];

const mindsetShifts = [
  {
    old: "Vše je moc vážné",
    next: "Život je vlastně hra",
    text: "Když přestaneš brát každé rozhodnutí jako definitivní, začneš se hýbat. Ve hře si můžeš hrát.",
  },
  {
    old: "Musí to být dokonalé",
    next: "Good enough stačí (80/20)",
    text: "80 % výsledku přijde z 20 % úsilí. Zbytek je prokrastinace převlečená za pečlivost.",
  },
  {
    old: "Co když to dopadne špatně?",
    next: "Připravím se na nejhorší, zbytek nechám být",
    text: "Představ si worst case. Smiř se, že to takto může dopadnout. A pak udělej vše proto, aby to dopadlo lépe.",
  },
  {
    old: "Dopaminový hit z plánování",
    next: "Dobrý pocit z konání",
    text: "Dobrý pocit z odvedené práce je vždy násobně lepší, než dopaminový hit z pouhého plánování.",
  },
  {
    old: "Musím to mít promyšlené dopředu",
    next: "Přijdu na to cestou",
    text: "Nemůžeš naplánovat cestu, po které jsi nikdy nešel. První krok ti ukáže víc než měsíc přemýšlení.",
  },
  {
    old: "Nesmím vypadat hloupě",
    next: "Dovolím si nevědět",
    text: "Strach z toho, že budeš vypadat hloupě, tě drží v hlavě. Lidi, co se nebojí být za hlupáka, se učí 10× rychleji.",
  },
];

const exercises = [
  {
    emoji: "🧘",
    title: "Cílená nuda",
    text: "15 minut denně: žádný telefon, žádná stimulace. Jen sedíš a necháš mozek dělat, co potřebuje. Zní to jednoduše. Zkus to.",
  },
  {
    emoji: "📋",
    title: "To-do se třemi věcmi",
    text: "Maximálně 3 úkoly na den. Pouze ty nejdůležitější. Když je splníš, můžeš přidat 3 „nice to have\". Ale ty první tři jsou povinné.",
  },
  {
    emoji: "🎲",
    title: "Experimentální den",
    text: "Jeden den nebo odpoledne, kdy děláš výhradně věci, které normálně neděláš. Nová hudba, nový žánr filmu, místo kde jsi nikdy nebyl, jídlo které normálně nejíš. Rozbíjíš autopilota.",
  },
];

export default function KoucingPage() {
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
                Možná koučing vůbec{" "}
                <span className="underline-playful">nepotřebuješ.</span>
              </h1>
              <p className="font-display text-xl md:text-2xl font-extrabold text-foreground">
                Koučing není pro každého.
              </p>
              <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
                Je to intenzivní práce &mdash; pro lidi, kteří se buď vůbec nehýbají směrem, kam chtějí, nebo se hýbají, ale příliš pomalu. Pokud hledáš spíš vlastní tempo a prostor na prozkoumávání, zkus kouknout do{" "}
                <Link href="/knihovna" className="text-primary font-semibold hover:opacity-80 transition-opacity">knihovny</Link>
                {", "}nebo můžeš vyzkoušet mou apku{" "}
                <a href="https://thinkable.website" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:opacity-80 transition-opacity">Thinkable</a>. Pokud jsi už různě věci zkoušel a jsi stále zaseklý/á, tak si zarezervuj schůzku zdarma a kouknem na to, jak ti můžu pomoct.
              </p>
              <Link href="#rezervace" className="btn-playful text-lg">
                Rezervovat konzultaci zdarma &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Můj přístup ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-8">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Můj přístup
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Z hlavy do <span className="underline-playful">života</span>
            </h2>
          </div>

          <div className="paper-card p-8 md:p-10 space-y-5">
            <p className="text-lg text-foreground/80 leading-relaxed">
              Většinu života jsem strávil v hlavě. Plánoval, analyzoval, zvažoval &mdash; a ztrácel se v tom, místo abych žil. Poznám ten pocit: víš, jak chceš, aby tvůj život vypadal, ale místo žití ho přemýšlíš. A ta mezera mezi hlavou a životem tě vyčerpává.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Cíl je jednoduchý &mdash; přejít co nejvíc <span className="underline-playful font-semibold">z hlavy do života</span>. Ne ho dokonale promyslet, ale reálně ho žít. Koučink je nástroj, kterým ten přechod zrychluju &mdash; sobě i lidem, co se zasekli ve stejném místě.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Nejsem klasický kouč, který se jen ptá &bdquo;a co ty na to?&ldquo; Kombinuju koučink s mentoringem &mdash; když je potřeba nasměrovat, nasměruju. Když je potřeba naslouchat, naslouchám. Níže najdeš celý můj přístup krok za krokem, zdarma. Koučink je pak pojistka, že to tentokrát opravdu uděláš.
            </p>
          </div>
        </section>

        {/* ─── 4 fáze ─── */}
        <section
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {phases.map((phase) => (
              <div key={phase.n} className="paper-card p-6 relative">
                <span className="absolute top-4 left-5 w-7 h-7 rounded-full bg-surface-low flex items-center justify-center text-muted font-display font-bold text-sm">
                  {phase.n}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-[#ffe4cc] flex items-center justify-center mb-4 text-2xl ml-auto">
                  {phase.emoji}
                </div>
                <h3 className="font-display text-xl font-extrabold mb-3">{phase.title}</h3>
                <p className="text-foreground/70 leading-relaxed text-[0.95rem]">{phase.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Mindset shifty ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#7766d8] font-bold mb-2">
              Mindsety
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Na čem budeme <span className="underline-playful">pracovat</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mindsetShifts.map((shift) => (
              <div key={shift.old} className="paper-card p-6">
                <div className="flex flex-col gap-1 mb-3">
                  <p className="text-sm text-muted line-through decoration-[#cdc4f5] decoration-2">
                    {shift.old}
                  </p>
                  <p className="font-display text-lg font-extrabold text-primary flex items-start gap-2">
                    <span className="text-primary/50 shrink-0">&rarr;</span>
                    {shift.next}
                  </p>
                </div>
                <p className="text-foreground/70 leading-relaxed text-[0.95rem]">{shift.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Cvičení ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#2ba89e] font-bold mb-2">
              Praxe
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Zkus to <span className="underline-teal">hned zítra</span>
            </h2>
            <p className="text-muted mt-3 max-w-2xl mx-auto">
              Tohle jsou příklady cvičení, se kterými pracuju. V koučinku vybíráme na míru &mdash; podle toho, co přesně tě blokuje. Ale tyhle si můžeš vyzkoušet sám, hned teď.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exercises.map((ex) => (
              <div key={ex.title} className="paper-card p-6">
                <div className="w-12 h-12 rounded-2xl bg-[#c6f1ec] flex items-center justify-center mb-4 text-2xl">
                  {ex.emoji}
                </div>
                <h3 className="font-display text-lg font-extrabold mb-2">{ex.title}</h3>
                <p className="text-foreground/70 leading-relaxed text-[0.95rem]">{ex.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Aha moment ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          <div className="paper-card p-8 md:p-12 text-center bg-gradient-to-br from-[#fff4eb] to-[#f1eefc]">
            <p className="text-5xl mb-4">💡</p>
            <p className="font-display text-xl md:text-2xl font-extrabold leading-snug max-w-3xl mx-auto">
              Většina klientů po pár týdnech říká totéž:{" "}
              <span className="underline-playful">
                &bdquo;To bylo celou dobu takhle jednoduché?&ldquo;
              </span>
            </p>
            <p className="text-lg text-foreground/70 mt-4 max-w-xl mx-auto">
              Ano. Není to složité. Je to těžké. A to je zásadní rozdíl.
            </p>
          </div>
        </section>

        {/* ─── Rezervace + Balíčky ─── */}
        <section
          id="rezervace"
          className="scroll-mt-24 animate-fade-up"
          style={{ animationDelay: "600ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[#2ba89e] font-bold mb-2">
              Začni tady
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Pojďme se nejdřív <span className="underline-teal">potkat</span>
            </h2>
            <p className="text-muted mt-3 max-w-xl mx-auto">
              Na 30 minutách zjistíme, co tě trápí, jaké jsou možnosti &mdash; a hlavně jestli ti vůbec mohu pomoct. Bez tlaku, bez závazku.
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

              <div className="flex-1 flex flex-col justify-center space-y-2">
                <LeadForm
                  source="koucing_konzultace"
                  compact
                  showMessage
                  messageLabel="Co tě sem přivedlo? (nepovinné)"
                  messagePlaceholder="Jen pár vět — ať už dopředu vím, kde jsi..."
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

          {/* Balíčky */}
          <div className="paper-card p-8 space-y-5">
            <h3 className="font-display text-xl font-extrabold">Jak to vypadá prakticky</h3>
            <p className="text-muted leading-relaxed">
              Pokud se po konzultaci rozhodneme pokračovat, díváme se na tvůj život jako na celek &mdash; a pracujeme na tom, co je právě teď nejdůležitější. Každé sezení má jasný výstup a konkrétní kroky k akci.
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
