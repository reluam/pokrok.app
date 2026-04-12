import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-static";

const pillars = [
  {
    emoji: "🎭",
    title: "Hravost",
    description: "Skoro nic není tak vážné, aby se to nedalo brát s nadhledem. A je třeba si to občas připomenout.",
  },
  {
    emoji: "🔍",
    title: "Zvídavost",
    description: "Moje obrana proti autopilotovi. Neustálá potřeba koukat pod kapotu věcem, které \"prostě tak jsou\".",
  },
  {
    emoji: "💬",
    title: "Upřímnost",
    description: "Lhaní si do kapsy je hrozná dřina, která nikam nevede. I malé lži mívají velké náklady.",
  },
  {
    emoji: "🌊",
    title: "Otevřenost",
    description: "Ochota přiznat, že věci mohou být jinak, než si zrovna myslím. Bez otevřené hlavy se ta hra na život nedá moc dobře hrát.",
  },
  {
    emoji: "✨",
    title: "Radost",
    description: "Když se někomu něco podaří, tak chci mít upřímnou radost. Je skvělé, co jsme jako lidi dokázali.",
  },
];

export default function OMnePage() {
  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-28 md:pt-32 pb-16 md:pb-20">

        {/* ─── Hero ─── */}
        <section className="mb-16 md:mb-20 animate-fade-up relative">
          <div className="absolute -top-4 right-4 text-3xl animate-float opacity-60 hidden md:block">
            🌿
          </div>

          <div className="paper-card p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
              <div className="flex-1">
                <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                  Hledám <span className="underline-playful">odpovědi</span>
                </h1>
                <p className="text-lg text-foreground/65 leading-relaxed mb-6">
                  Jsem Matěj. Bývalý muzikant, projektový manažer a věčný hledač. Většinu života jsem strávil snahou přijít na to, jak se tenhle život vlastně &bdquo;hraje&ldquo;. Přečetl jsem víc knih o produktivitě, než je zdravé, abych nakonec zjistil, že odpovědi se neschovávají v kapitolách, ale v tom, co dělám každý den.
                </p>
                <a
                  href="#moje-cesta"
                  className="btn-playful !px-6 !py-3 text-base"
                >
                  Moje cesta &darr;
                </a>
              </div>
              <div className="paper-card overflow-hidden w-full md:w-72 aspect-square shrink-0">
                <Image
                  src="/o-mne-moment.jpg"
                  alt="Ten moment"
                  fill
                  className="object-cover !relative"
                  sizes="(max-width: 768px) 100vw, 288px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Od hloubání k Žiju life ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="paper-card p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
              <div className="paper-card overflow-hidden w-full md:w-72 aspect-square shrink-0 order-2 md:order-1">
                <Image
                  src="/o-mne-hloubani.jpg"
                  alt="Od hloubání k Žiju life"
                  fill
                  className="object-cover !relative"
                  sizes="(max-width: 768px) 100vw, 288px"
                />
              </div>
              <div className="flex-1 order-1 md:order-2">
                <h2 className="font-display text-3xl md:text-4xl font-extrabold leading-tight mb-6 tracking-tight">
                  Od hloubání k <span className="underline-teal">Žiju life</span>
                </h2>
                <p className="text-lg text-foreground/65 leading-relaxed">
                  Právě z tohohle zjištění vzniklo Žiju.life. Došlo mi totiž, že smysl života se nehledá — ten se tvoří. Každý den a každým jedním rozhodnutím. Vytvářím tady prostor pro lidi, kteří už nechtějí žít podle cizích pravidel, ale podle vlastních hodnot a svědomí. Skrz praktické nástroje, inspiraci a lidský rozhovor ti pomůžu složit vlastní životní mozaiku.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5 věcí, o které se opírám ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Moje hodnoty
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              5 věcí, o které se <span className="underline-playful">opírám</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="paper-card p-6"
              >
                <span className="text-2xl block mb-3">{pillar.emoji}</span>
                <h3 className="font-display text-lg font-extrabold text-primary mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Moje cesta ─── */}
        <section
          id="moje-cesta"
          className="mb-16 md:mb-20 scroll-mt-24 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="paper-card p-8 md:p-12 space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
              Moje cesta: Od úniku k <span className="underline-playful">přítomnosti</span>
            </h2>
            <div className="space-y-5 text-lg text-foreground/65 leading-relaxed">
              <p>
                Od mala jsem si přál jediné — fungovat jako normální člověk. Jenže čím víc jsem se snažil, tím míň to šlo. Ostatní jako by věděli, co se životem dělat. Já ne. Ten pocit tam byl vždycky. Tiše, v pozadí, jako něco, co jsem si nechtěl přiznat.
              </p>
              <p>
                Tak jsem zkoušel. Skládal jsem hudbu. Rozjížděl e-shopy. Organizoval festivaly. Četl jsem hory knížek, testoval frameworky a aplikace. Měnil jsem směr tolikrát, že jsem si začal připadat jako podvodník. A mezi tím vším jsem tajně doufal, že mě někdo zachrání.
              </p>
              <p className="font-display text-xl font-extrabold text-foreground">
                Problém nebyl v tom, že jsem nevěděl, co chci. Problém byl, že jsem žil v budoucnu.
              </p>
              <p>
                Nechtěl jsem vidět tu propast mezi tím, kde jsem, a tím, kde chci být. Ta mezera mě ochromovala. Místo abych udělal jeden malý krok, čekal jsem na zázrak, který mě přenese na druhou stranu. Nakonec mě to dovedlo na terapii.
              </p>
              <p>
                Moje terapeutka mi opakovala pořád to samé: <em>&bdquo;Tvůj život je mozaika. Máš skvělou představu, jak má vypadat. Teď ji musíš začít skládat. Den po dni.&ldquo;</em>
              </p>
              <p>
                Strašně se mi to příčilo. Chtěl jsem zkratku. Chtěl jsem to zabalit a najít si jinou terapeutku. Ale neudělal jsem to. Říkal jsem si, že už nemám co ztratit — všechny moje předchozí strategie stejně selhaly.
              </p>
              <p>
                Tak jsem to zkusil. Ze začátku mi to přišlo nesmyslné. Přestat snít o &bdquo;krásných zítřcích&ldquo; a začít se probírat každodenní realitou. Pokračoval jsem v tom hlavně proto, abych jí dokázal, že to nefunguje.
              </p>
              <p className="font-display text-xl font-extrabold text-foreground">
                A pak se stala zvláštní věc.
              </p>
              <p>
                Právě ve chvíli, kdy jsem si tu propast připustil — kdy jsem se přestal tvářit, že neexistuje — jsem začal dělat největší pokroky. Ne proto, že bych našel lepší systém. Ale proto, že jsem konečně začal reálně něco dělat.
              </p>
              <p>
                Postupně se to stalo mým normálem. Začal jsem dělat důležitá rozhodnutí včas. Začal jsem věci dotahovat. Čím víc jsem se soustředil na to, co dělám právě teď, tím víc jsem ten život skutečně prožíval.
              </p>
              <p>
                Celý život jsem utíkal před &bdquo;normálností&ldquo;. Ironií je, že právě přijetí obyčejného, každodenního života mi dalo víc než roky hledání výjimečnosti.
              </p>
              <p>
                Tohle byl můj největší zlom. Pořád jsem na cestě, ale jedno vím jistě: Chci zkoumat, jak žít skutečně prožitý život. A předávat dál, co jsem zjistil.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Substack ─── */}
        <section
          className="mb-16 md:mb-20 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="paper-card p-8 md:p-12 text-center space-y-5">
            <svg className="w-10 h-10 text-primary mx-auto" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24l9.56-5.26L20.539 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
            </svg>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Odebírej na <span className="underline-playful">Substacku</span>
            </h2>
            <p className="text-lg text-foreground/65 leading-relaxed max-w-2xl mx-auto">
              Pravidelné úvahy, postřehy a věci, které mě napadnou cestou. Bez spamu, bez prodeje — jen upřímné psaní o tom, jak se snažím žít podle sebe.
            </p>
            <a
              href="https://zijulife.substack.com/?r=86mho4&utm_campaign=pub-share-checklist"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-playful"
            >
              Přihlásit se k odběru &rarr;
            </a>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section
          className="animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          <div className="paper-card p-8 md:p-10 text-center space-y-5">
            <p className="text-2xl mb-1">👋</p>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold leading-snug">
              Chceš zjistit, kde teď jsi?
            </h3>
            <p className="text-muted max-w-lg mx-auto">
              Vyber si cestu, která ti dává smysl.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/koucing" className="btn-playful">
                Koučing &rarr;
              </Link>
              <Link
                href="/knihovna"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-display font-bold text-base text-foreground/70 border-2 border-outline hover:border-foreground/30 hover:text-foreground transition-colors"
              >
                Knihovna &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
