import Image from "next/image";

export const dynamic = "force-static";

interface Pillar {
  title: string;
  description: string;
}

const pillars: Pillar[] = [
  {
    title: "Hravost",
    description: "Skoro nic není tak vážné, aby se to nedalo brát s nadhledem. A je třeba si to občas připomenout.",
  },
  {
    title: "Zvídavost",
    description: "Moje obrana proti autopilotovi. Je to neustálá potřeba koukat pod kapotu věcem, které \"prostě tak jsou\", a zjišťovat, jak doopravdy fungují.",
  },
  {
    title: "Upřímnost",
    description: "Lhaní si do kapsy je hrozná dřina, která nikam nevede. I malé lži mívají velké náklady.",
  },
  {
    title: "Otevřenost",
    description: "Ochota přiznat, že věci mohou být jinak, než si zrovna myslím. Protože bez otevřené hlavy se ta hra na život nedá moc dobře hrát.",
  },
  {
    title: "Radost",
    description: "Když se někomu něco podaří, tak chci mít upřímnou radost. Je skvělé, co jsme jako lidi dokázali.",
  },
];

export default function OMnePage() {
  return (
    <main className="min-h-screen bg-[#FDFDF7]">
      {/* Hero: Ten moment */}
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-16">
        <div className="bg-[#fdf0e6]/50 border border-black/8 rounded-[32px] px-8 md:px-16 py-14 md:py-20">
          <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-center">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                Hledám odpovědi
              </h1>
              <p className="text-lg text-foreground/65 leading-relaxed mb-6">
                Jsem Matěj. Bývalý muzikant, projektový manažer a věčný hledač. Většinu života jsem strávil snahou přijít na to, jak se tenhle život vlastně &bdquo;hraje&ldquo;. Přečetl jsem víc knih o produktivitě, než je zdravé, abych nakonec zjistil, že odpovědi se neschovávají v kapitolách, ale v tom, co dělám každý den. Tady začala moje cesta od nekonečného hloubání k žité realitě.
              </p>
              <a
                href="#moje-cesta"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-foreground/15 font-semibold text-base text-foreground/70 hover:border-foreground/30 hover:text-foreground transition-colors bg-white/60"
              >
                Moje cesta: Jak jsem přestal čekat na zázrak ↓
              </a>
            </div>
            <div className="relative w-full md:w-72 aspect-square rounded-2xl overflow-hidden shrink-0">
              <Image
                src="/o-mne-moment.jpg"
                alt="Ten moment"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Od hloubání k Žiju life */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <div className="bg-white border border-black/8 rounded-[32px] px-8 md:px-16 py-14 md:py-20">
          <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-center">
            <div className="relative w-full md:w-72 aspect-square rounded-2xl overflow-hidden shrink-0 order-2 md:order-1">
              <Image
                src="/o-mne-hloubani.jpg"
                alt="Od hloubání k Žiju life"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
              />
            </div>
            <div className="flex-1 order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 leading-tight">
                Od hloubání k Žiju life
              </h2>
              <p className="text-lg text-foreground/65 leading-relaxed">
                Právě z tohohle zjištění vzniklo Žiju.life. Došlo mi totiž, že smysl života se nehledá — ten se tvoří. Každý den a každým jedním rozhodnutím. Vytvářím tady prostor pro lidi, kteří už nechtějí žít podle cizích pravidel, ale podle vlastních hodnot a svědomí. Skrz praktické nástroje, inspiraci a lidský rozhovor ti pomůžu složit vlastní životní mozaiku. Protože právě v té každodennosti se skrývá život, který stojí za to prožít.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 věcí, o které se opírám */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground text-center mb-10">
          5 věcí, o které se opírám
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-white border border-black/8 rounded-[24px] px-6 py-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <h3 className="text-lg font-bold text-accent mb-3">
                {pillar.title}
              </h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Moje cesta */}
      <section id="moje-cesta" className="max-w-5xl mx-auto px-5 pb-16 scroll-mt-8">
        <div className="bg-white border border-black/8 rounded-[32px] px-8 md:px-16 py-14 md:py-20 space-y-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            Moje cesta: Od úniku k přítomnosti
          </h2>
          <div className="space-y-6 text-lg text-foreground/65 leading-relaxed">
            <p>
              Od mala jsem si přál jediné — fungovat jako normální člověk. Jenže čím víc jsem se snažil, tím míň to šlo. Ostatní jako by věděli, co se životem dělat. Já ne. Ten pocit tam byl vždycky. Tiše, v pozadí, jako něco, co jsem si nechtěl přiznat.
            </p>
            <p>
              Tak jsem zkoušel. Skládal jsem hudbu. Rozjížděl e-shopy. Organizoval festivaly. Četl jsem hory knížek, testoval frameworky a aplikace. Měnil jsem směr tolikrát, že jsem si začal připadat jako podvodník. A mezi tím vším jsem tajně doufal, že mě někdo zachrání. Že přijde moment, kdy si mě někdo všimne a rázem se všechno vyřeší. Chtěl jsem být speciální. Chtěl jsem, aby pro mě neplatila běžná pravidla.
            </p>
            <p className="text-xl font-bold text-foreground">
              Problém nebyl v tom, že jsem nevěděl, co chci. Problém byl, že jsem žil v budoucnu.
            </p>
            <p>
              Nechtěl jsem vidět tu propast mezi tím, kde jsem, a tím, kde chci být. Ta mezera mě ochromovala. Místo abych udělal jeden malý krok, čekal jsem na zázrak, který mě přenese na druhou stranu. Nakonec mě to dovedlo na terapii. Ne z odvahy, ale proto, že jsem odkládal rozhodnutí tak dlouho, až se věci začaly sypat samy.
            </p>
            <p>
              Moje terapeutka mi opakovala pořád to samé: <em>&bdquo;Tvůj život je mozaika. Máš skvělou představu, jak má vypadat. Teď ji musíš začít skládat. Den po dni.&ldquo;</em>
            </p>
            <p>
              Strašně se mi to příčilo. Chtěl jsem zkratku. Chtěl jsem, aby to za mě vyřešil někdo jiný. Chtěl jsem to zabalit a najít si jinou terapeutku. Ale neudělal jsem to. Říkal jsem si, že už nemám co ztratit — všechny moje předchozí strategie stejně selhaly.
            </p>
            <p>
              Tak jsem to zkusil. Ze začátku mi to přišlo nesmyslné. Přestat snít o &bdquo;krásných zítřcích&ldquo; a začít se probírat každodenní realitou pro mě znamenalo připustit si tu šeď. Žádná velká vize. Jen dnešek. Pokračoval jsem v tom hlavně proto, abych jí dokázal, že to nefunguje.
            </p>
            <p className="text-xl font-bold text-foreground">
              A pak se stala zvláštní věc.
            </p>
            <p>
              Právě ve chvíli, kdy jsem si tu propast připustil — kdy jsem se přestal tvářit, že neexistuje — jsem začal dělat největší pokroky. Ne proto, že bych našel lepší systém. Ale proto, že jsem konečně začal reálně něco dělat.
            </p>
            <p>
              Postupně se to stalo mým normálem. Začal jsem dělat důležitá rozhodnutí včas a nenechával je vyhnít. Začal jsem věci dotahovat. Začal jsem být dochvilný — ne proto, že bych si hlídal hodinky, ale protože jsem začal dělat vědomá rozhodnutí o svém čase. Čím víc jsem se soustředil na to, co dělám právě teď, tím víc jsem ten život skutečně prožíval.
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

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 pb-24">
        <div className="bg-[#fdf0e6]/50 border border-black/8 rounded-[28px] px-8 md:px-12 py-10 text-center space-y-5">
          <p className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug">
            Chceš zjistit, kde teď jsi a kam chceš?
          </p>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Vyber si cestu, která ti dává smysl.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dilna"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors shadow-lg"
            >
              Dílna →
            </a>
            <a
              href="/koucing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors shadow-lg"
            >
              Koučing →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
