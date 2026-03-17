"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "zaklad" | "principy" | "pilulky";

interface Resource {
  label: string;
  href: string;
  external?: boolean;
  prefix?: string;
}

interface Principle {
  id: string;
  category: Category;
  emoji: string;
  title: string;
  subtitle?: string;
  lead: string;
  body: string[];
  tips?: string[];
  resources?: Resource[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const PRINCIPLES: Principle[] = [
  // ZÁKLAD
  {
    id: "spanek", category: "zaklad", emoji: "🌙",
    title: "Spánek", subtitle: "Aktualizace systému",
    lead: "Spánek není luxus — je to naprostý základ. Mozek není izolovaný od těla. Žádný time management tě nezachrání, pokud ignoruješ základní fyzické potřeby.",
    body: [
      "Osobně jsem nikdy neměl velký problém s usínáním nebo vstáváním. Důvod je ten, že jsem pravděpodobně od mala přirozeně dodržoval dobrou spánkovou hygienu.",
    ],
    tips: [
      "Vstávej každý den ve stejnou dobu — i o víkendu.",
      "Hodinu před spánkem nepoužívej obrazovky.",
      "Poslední kávu (kofein) pij nejpozději kolem 15:00.",
    ],
    resources: [
      { label: "Andrew Huberman: Nástroje pro lepší spánek", href: "https://www.hubermanlab.com/newsletter/improve-your-sleep", external: true },
      { label: "Proč spíme", href: "https://go.dognet.com/?cid=173&chid=hfEhyNSd&refid=698ee425434f4&url=https%3A%2F%2Fwww.melvil.cz%2Fkniha-proc-spime%2F", external: true, prefix: "Kniha" },
    ],
  },
  {
    id: "strava", category: "zaklad", emoji: "🥩",
    title: "Strava", subtitle: "Palivo",
    lead: "Naše tělo si miliony let zvykalo na určitý způsob stravování. Abychom se o tělo starali dobře, musíme mu dávat správný typ paliva.",
    body: [
      "Pak jsme před 10 000 lety zdomestikovali zvířata a začali pěstovat plodiny pro masy. V posledních 60 letech jsme to dotáhli do extrému ve formě rafinovaných cukrů.",
    ],
    tips: [
      "Kompletně odstraň rafinované cukry (sladkosti, zákusky, limonády).",
      "Sniž příjem sacharidů — méně brambor, rýže, ideálně ven s pečivem.",
      "Zvyš příjem zdravých tuků a zeleniny (tučné ryby, avokádo, ořechy, brokolice...).",
    ],
    resources: [
      { label: "Geniální potraviny", href: "/inspirace/1772998750188", prefix: "Moje inspirace" },
    ],
  },
  {
    id: "pohyb", category: "zaklad", emoji: "🚶‍♂️",
    title: "Pohyb", subtitle: "Čištění hlavy",
    lead: "Jako lovci a sběrači jsme byli většinu dne na nohách. Tak se naše tělo vyvíjelo. Dnes jsme přikováni k židlím — a platíme za to.",
    body: [
      "S domestikací a specializací se pohyb omezil. V posledním století jsme to dotáhli do extrému — většinu dne se vůbec nehýbeme.",
    ],
    tips: [
      "Zahaj den protažením nebo cvičením — jóga je naprosto ideální.",
      "Každé 2 hodiny se na 5 minut projdi.",
      "Nachoď za den minimálně 10 000 kroků (20 000 je ještě lepších).",
    ],
    resources: [
      { label: "Čtyřhodinové tělo", href: "/inspirace/1772999485170", prefix: "Moje inspirace" },
    ],
  },
  {
    id: "odpocinek", category: "zaklad", emoji: "🛑",
    title: "Odpočinek", subtitle: "Regenerace",
    lead: "Aby náš mozek i tělo fungovaly optimálně, potřebují dostatek odpočinku. Minimem je alespoň jeden celý den v týdnu bez práce.",
    body: [
      "Míra odpočinku závisí na mnoha faktorech — jak moc se hýbeme, jíme a spíme. Jako naprosté minimum se od biblických dob doporučuje alespoň jeden celý volný den.",
    ],
    tips: [
      "Vyhraď si jeden den v týdnu s absolutním zákazem jakékoliv práce.",
      "V době odpočinku buď v přítomném okamžiku — nepřemýšlej nad minulostí ani budoucností.",
      "Když se přes den cítíš vyčerpaně, dej si 30–60 minut aktivity nesouvisející s prací.",
    ],
    resources: [
      { label: "Moc přítomného okamžiku", href: "https://www.knihydobrovsky.cz/kniha/moc-pritomneho-okamziku-5423462", external: true, prefix: "Kniha" },
      { label: "Šťastnější", href: "https://go.dognet.com/?cid=173&chid=hfEhyNSd&refid=698ee425434f4&url=https%3A%2F%2Fwww.melvil.cz%2Fkniha-stastnejsi%2F", external: true, prefix: "Kniha" },
    ],
  },
  // PRINCIPY
  {
    id: "skola", category: "principy", emoji: "🎓",
    title: "Co se ve škole neučí?",
    lead: "Ve škole tě připravovali na testy, ne na hru jménem život. Neučili tě, jak zacházet s penězi, emocemi, vlastní energií ani vztahy.",
    body: [
      "Většinu důležitých dovedností se učíš až za pochodu — v práci, ve vztazích, v krizi. Je to náročné, ale má to jednu výhodu: můžeš si nastavit vlastní pravidla hry.",
      "Čím dřív přijmeš, že \u201Eškolní hru\u201D máš za sebou a teď hraješ tu vlastní, tím snáz si dovolíš hledat lepší systém pro sebe — ne pro vysvědčení.",
    ],
  },
  {
    id: "zodpovednost", category: "principy", emoji: "🎯",
    title: "Za svůj život jsi zodpovědný pouze ty sám.",
    lead: "Nikdo jiný nemůže žít tvůj život za tebe. V určitém bodě si prostě musíš říct: \u201EJe to na mně.\u201C",
    body: [
      "Můžeš mít podporu, kouče, partnera, komunitu. Ale rozhodnutí, která děláš každé ráno, večer i mezi tím, za tebe nikdo neudělá.",
      "To není tlak, ale svoboda. Jakmile to přijmeš, můžeš s vlastním životem mnohem víc experimentovat.",
    ],
  },
  {
    id: "cernobile", category: "principy", emoji: "🌈",
    title: "Skoro nic není pouze černobílé.",
    lead: "Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžeš nastavit vlastní pravidla.",
    body: [
      "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Buď stabilita, nebo zážitky. Tenhle způsob přemýšlení tě zbytečně zamyká.",
      "Mezi černou a bílou je spousta odstínů. A právě tam si můžeš začít skládat život podle sebe — ne podle škatulek ostatních.",
    ],
  },
  {
    id: "smysl", category: "principy", emoji: "✨",
    title: "Svůj životní smysl tvoříš každodenními kroky.",
    lead: "Smysl nepřijde shora jako jeden velký \u201Eaha moment\u201D. Vzniká z malých voleb, které děláš dnes a zítra.",
    body: [
      "Často čekáme na jeden zlomový okamžik, který nám \u201Evysvětlí život\u201D. V praxi smysl vzniká z drobných rozhodnutí — čemu říkáš ano, čemu ne, kam dáváš energii.",
      "Můžeš začít maličkostmi: jedním projektem, jedním návykem, jedním rozhovorem, který už dlouho odkládáš.",
    ],
  },
  {
    id: "sebevedomi", category: "principy", emoji: "💪",
    title: "Sebevědomí si vybuduješ děláním těžkých věcí.",
    lead: "Sebevědomí není afirmace v zrcadle, ale důkaz. Přichází, když děláš kroky, do kterých se ti nechce — a ustojíš je.",
    body: [
      "Můžeš si opakovat, že na to máš. Ale dokud si to neověříš v reálném světě, hlava tomu stejně úplně nevěří.",
      "Každý malý \u201Etěžký krok\u201D — nepříjemný hovor, odmítnutí, nový projekt — je malý důkaz pro sebevědomí: \u201EZvládl jsem to. Dám i další věc.\u201C",
    ],
  },
  {
    id: "hotove", category: "principy", emoji: "✅",
    title: "Hotové je lepší než dokonalé.",
    lead: "Perfekcionismus je chytře maskovaný strach. Dokončené věci mění život — ne ty rozdělané.",
    body: [
      "Můžeš měsíce ladit detaily projektu nebo newsletteru — ale dokud to nepublikuješ, realita ti nedá žádnou zpětnou vazbu. Zůstaneš v bezpečí vlastní hlavy.",
      "Když začneš cílit na \u201Edost dobré na odeslání\u201D místo dokonalosti, posuneš se násobně rychleji. Učíš se z reálných reakcí, ne z hypotetických scénářů.",
    ],
  },
  {
    id: "intuice", category: "principy", emoji: "🔮",
    title: "Intuice pracuje ve tvůj prospěch.",
    lead: "Intuice není magie. Je to zhuštěná zkušenost tvého mozku, která se ozývá dřív, než ji stihneš rozumově vysvětlit.",
    body: [
      "Když máš z člověka, spolupráce nebo rozhodnutí \u201Edivný pocit\u201D, v pozadí běží spousta drobných signálů, které tvůj mozek dávno viděl — jen je neumíš hned pojmenovat.",
      "Intuici se vyplatí brát vážně, ale ne slepě. Použij ji jako první kompas a doplň rozumem: \u201ECo přesně na téhle situaci mi nesedí?\u201C",
    ],
  },
  // PILULKY
  {
    id: "mozek", category: "pilulky", emoji: "🧠",
    title: "Tvůj mozek je hloupější, než si myslíš.",
    lead: "Většinu času jedeš na autopilota — zkratky, emoce a příběhy v hlavě často vyhrávají nad realitou.",
    body: [
      "Mozek není nástroj na \u201Epravdu\u201D. Je to nástroj na přežití: šetřit energii, držet se známého, vyhýbat se riziku a mít pravdu za každou cenu.",
      "Když s tím začneš počítat, přestaneš se divit vlastním přešlapům. Místo sebemrskání začneš stavět systémy, které s autopilotem umí pracovat.",
    ],
  },
  {
    id: "vazne-sebe", category: "pilulky", emoji: "😄",
    title: "Neber se tak vážně.",
    lead: "Ego miluje drama. Humor a lehkost ti vrátí nadhled — a často i odvahu.",
    body: [
      "Když bereš všechno smrtelně vážně, každá chyba je katastrofa a každý pohled ostatních je soud. Tím si zbytečně přidáváš tlak.",
      "Lehkovážnost není nezodpovědnost. Je to schopnost udržet si odstup: \u201ETohle jsem udělal špatně. Neznamená to, že jsem špatný.\u201C",
    ],
  },
  {
    id: "vazne-svet", category: "pilulky", emoji: "🌍",
    title: "A neber svět okolo tak vážně.",
    lead: "Spousta \u201Epravidel\u201D je jen společenská hra. Když to uvidíš, přestaneš se bát pohybu.",
    body: [
      "Lidé často působí sebejistě, ale uvnitř řeší podobné věci jako ty: nejistotu, porovnávání, strach z odmítnutí. Svět není tak pevný a soudný, jak se tváří.",
      "Když přestaneš čekat \u201Epovolení\u201D, začneš tvořit. A zjistíš, že většina bariér byla jen v hlavě.",
    ],
  },
  {
    id: "zvirata", category: "pilulky", emoji: "🦁",
    title: "Pod povrchem jsme stále jen zvířata.",
    lead: "V úplném základu jsme biologické mašiny. Často si myslíme, že \u201Ejsme nad tím\u201D, ale nejsme.",
    body: [
      "Nálada, motivace i sebeovládání nejsou jen \u201Esíla vůle\u201D. Jsou to hormony, spánek, jídlo, pohyb, stres a prostředí. Proto sekce Základ není \u201Eself-care\u201D, ale infrastruktura.",
      "Když tohle přijmeš, přestaneš moralizovat vlastní výkyvy a začneš je řídit jako systém — ne jako charakterovou vadu.",
    ],
  },
  {
    id: "jedna-vec", category: "pilulky", emoji: "🪄",
    title: "Žádná jedna věc to zázračně nevyřeší.",
    lead: "Žádný \u201Ehack\u201D to za tebe neodžije. Funguje jen kombinace malých kroků v čase.",
    body: [
      "Je lákavé věřit, že existuje jeden kurz, jedna kniha nebo jedna metoda, která všechno přepne. Realita je střízlivější — a zároveň mnohem víc pod tvojí kontrolou.",
      "Když přestaneš hledat zázrak a začneš skládat systém (spánek, jídlo, pohyb, vztahy, práce, pozornost), život se začne zlepšovat bez magie.",
    ],
  },
];

const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string; bg: string; description: string }> = {
  zaklad: {
    label: "Základ",
    emoji: "🧬",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    description: "Fyziologická mašina — spánek, strava, pohyb, odpočinek",
  },
  principy: {
    label: "Principy",
    emoji: "💡",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    description: "Jak o sobě a světě přemýšlíš",
  },
  pilulky: {
    label: "Pilulky",
    emoji: "💊",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    description: "Hořké pravdy, které ti pomůžou",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NavodNaZivotPage() {
  const [index, setIndex] = useState(0);

  const principle = PRINCIPLES[index];
  const currentCategory = principle.category;
  const meta = CATEGORY_META[currentCategory];

  const hasPrev = index > 0;
  const hasNext = index < PRINCIPLES.length - 1;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(PRINCIPLES.length - 1, i + 1)), []);

  const jumpToCategory = (cat: Category) => {
    const idx = PRINCIPLES.findIndex((p) => p.category === cat);
    if (idx !== -1) setIndex(idx);
  };

  const categoryPrinciples = PRINCIPLES.filter((p) => p.category === currentCategory);

  const counts: Record<Category, number> = {
    zaklad: PRINCIPLES.filter((p) => p.category === "zaklad").length,
    principy: PRINCIPLES.filter((p) => p.category === "principy").length,
    pilulky: PRINCIPLES.filter((p) => p.category === "pilulky").length,
  };

  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Hero: intro + sales card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Intro (2/3) */}
              <div className="lg:col-span-2 paper-card rounded-[28px] px-6 py-8 md:px-10 md:py-10 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40">
                  Matějův osobní tahák
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                  Návod na život
                </h1>
                <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl">
                  Toto je <strong>můj</strong> návod — soubor principů, hodnot a lekcí, podle kterých se snažím žít.
                  Není to dogma ani univerzální recept. Je to zrcadlo toho, co mi funguje.
                </p>
                <p className="text-base text-foreground/60 leading-relaxed max-w-3xl">
                  Posbíral jsem ho z vlastních chyb, z příběhů chytřejších lidí a z let experimentování.
                  Sdílím ho proto, aby ti mohl posloužit jako inspirace — ne jako návod k okopírování.
                  Tvůj život potřebuje tvůj vlastní kompas.
                </p>
              </div>

              {/* Sales card (1/3) */}
              <div className="paper-card rounded-[24px] px-6 py-7 space-y-4 border-2 border-accent/15">
                <div className="text-2xl">🗺️</div>
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-foreground leading-snug">
                    Sestav si svůj návod pro život
                  </h2>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    Tento návod je Matějův. Tvůj život ale potřebuje tvůj vlastní kompas.
                  </p>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Audit života ti v 7 krocích pomůže zjistit, kde teď jsi, co skutečně chceš
                  a co tě brzdí. Na konci dostaneš vlastní dokument — tvůj osobní návod.
                </p>
                <ul className="space-y-2">
                  {["Kde teď jsi?", "Energie & hodnoty", "Co skutečně chceš", "Co tě brzdí", "Tvůj vlastní plán"].map((step) => (
                    <li key={step} className="flex items-center gap-2 text-xs text-foreground/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/audit-zivota"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
                >
                  Začít audit
                  <ArrowRight size={16} />
                </Link>
                <p className="text-center text-xs text-foreground/40">
                  Průvodce, cvičení a šablony v jednom
                </p>
              </div>
            </div>

            {/* Category columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => jumpToCategory(key)}
                  className={`text-left p-4 md:p-5 rounded-2xl border-2 transition-all ${
                    currentCategory === key
                      ? `${m.bg} border-current ${m.color} shadow-md`
                      : "bg-white/70 border-black/8 hover:border-black/15 hover:shadow-md"
                  }`}
                >
                  <div className="text-2xl mb-2">{m.emoji}</div>
                  <div className={`font-bold text-sm md:text-base ${currentCategory === key ? m.color : "text-foreground"}`}>
                    {m.label}
                  </div>
                  <div className="text-xs text-foreground/55 mt-0.5 leading-snug hidden sm:block">{m.description}</div>
                  <div className={`text-xs font-semibold mt-2 ${currentCategory === key ? m.color : "text-foreground/40"}`}>
                    {counts[key]} {counts[key] === 1 ? "princip" : counts[key] < 5 ? "principy" : "principů"}
                  </div>
                </button>
              ))}

              {/* Technologie – coming soon */}
              <button
                disabled
                className="text-left p-4 md:p-5 rounded-2xl border-2 border-dashed border-black/10 bg-white/40 opacity-60 cursor-not-allowed hidden lg:block"
              >
                <div className="text-2xl mb-2">📱</div>
                <div className="font-bold text-sm md:text-base text-foreground/50">Technologie</div>
                <div className="text-xs text-foreground/40 mt-0.5 leading-snug hidden sm:block">Dobří sluhové, ale zlí páni</div>
                <div className="text-xs font-semibold mt-2 text-foreground/30">Připravuji</div>
              </button>
            </div>

            {/* Main: left sidebar + right principle */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Left: current category principle list */}
              <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24">
                <div className="paper-card rounded-[24px] px-4 py-5 space-y-3">
                  <div className={`flex items-center gap-2 text-sm font-bold px-1 ${meta.color}`}>
                    <span>{meta.emoji}</span>
                    {meta.label}
                  </div>
                  <ul className="space-y-0.5">
                    {categoryPrinciples.map((p) => {
                      const isActive = p.id === principle.id;
                      const pIndex = PRINCIPLES.findIndex((pr) => pr.id === p.id);
                      return (
                        <li key={p.id}>
                          <button
                            onClick={() => setIndex(pIndex)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-start gap-2.5 ${
                              isActive
                                ? `${meta.bg} ${meta.color} font-semibold`
                                : "hover:bg-black/5 text-foreground/65 hover:text-foreground"
                            }`}
                          >
                            <span className="text-base leading-none mt-0.5 flex-shrink-0">{p.emoji}</span>
                            <span className="leading-snug">{p.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>

              {/* Right: principle */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">

                {/* Nav bar */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/50">
                    {index + 1} / {PRINCIPLES.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={prev}
                      disabled={!hasPrev}
                      className="p-2 rounded-full border border-black/10 bg-white shadow-sm hover:shadow-md hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      aria-label="Předchozí"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={next}
                      disabled={!hasNext}
                      className="p-2 rounded-full border border-black/10 bg-white shadow-sm hover:shadow-md hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      aria-label="Další"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Principle card */}
                <article className="paper-card rounded-[24px] px-6 py-7 md:px-8 md:py-8 space-y-5">
                  {/* Category badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                    <span>{meta.emoji}</span>
                    {meta.label}
                  </span>

                  {/* Title */}
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none mt-0.5">{principle.emoji}</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">{principle.title}</h2>
                      {principle.subtitle && (
                        <p className="text-sm text-foreground/50 mt-0.5">{principle.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Lead */}
                  <p className="text-base md:text-lg text-foreground/80 leading-relaxed font-medium">{principle.lead}</p>

                  {/* Body */}
                  {principle.body.map((p, i) => (
                    <p key={i} className="text-sm md:text-base text-foreground/70 leading-relaxed">{p}</p>
                  ))}

                  {/* Tips */}
                  {principle.tips && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/50">Tipy</h4>
                      <ul className="space-y-2">
                        {principle.tips.map((tip, i) => (
                          <li key={i} className="flex gap-2.5 text-sm md:text-base text-foreground/75">
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent/60" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resources */}
                  {principle.resources && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/50">Zdroje</h4>
                      <ul className="space-y-1">
                        {principle.resources.map((r, i) => (
                          <li key={i} className="text-sm text-foreground/70">
                            {r.prefix && <span>{r.prefix}: </span>}
                            {r.external ? (
                              <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">{r.label}</a>
                            ) : (
                              <Link href={r.href} className="text-accent font-semibold hover:underline">{r.label}</Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>

                {/* Bottom prev/next */}
                <div className="flex justify-between">
                  <button
                    onClick={prev}
                    disabled={!hasPrev}
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                    {hasPrev && (
                      <span>{PRINCIPLES[index - 1].title.length > 32 ? PRINCIPLES[index - 1].title.slice(0, 32) + "…" : PRINCIPLES[index - 1].title}</span>
                    )}
                  </button>
                  <button
                    onClick={next}
                    disabled={!hasNext}
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-right"
                  >
                    {hasNext && (
                      <span>{PRINCIPLES[index + 1].title.length > 32 ? PRINCIPLES[index + 1].title.slice(0, 32) + "…" : PRINCIPLES[index + 1].title}</span>
                    )}
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
