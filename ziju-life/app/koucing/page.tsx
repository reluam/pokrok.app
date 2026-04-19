import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import HandDrawnCard from "@/components/HandDrawnCard";
import HandDrawnIcon from "@/components/HandDrawnIcon";
import { FeedCard, type CuratedPost } from "@/components/FeedCards";
import { getAllExercises, type Exercise } from "@/lib/exercises";
import { getCuratedPost } from "@/lib/curated-posts-db";

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

type ExerciseWithPost = Exercise & { relatedPost: CuratedPost | null };

const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: "fallback-1",
    slug: "cilena-nuda",
    emoji: "🧘",
    title: "Cílená nuda",
    bodyMarkdown:
      "15 minut denně: žádný telefon, žádná stimulace. Jen sedíš a necháš mozek dělat, co potřebuje. Zní to jednoduše. Zkus to.",
    orderIndex: 1,
    resourceUrl: null,
    relatedPostSlug: null,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-2",
    slug: "to-do-3",
    emoji: "📋",
    title: "To-do se třemi věcmi",
    bodyMarkdown:
      "Maximálně 3 úkoly na den. Pouze ty nejdůležitější. Když je splníš, můžeš přidat 3 „nice to have\". Ale ty první tři jsou povinné.",
    orderIndex: 2,
    resourceUrl: null,
    relatedPostSlug: null,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-3",
    slug: "experimentalni-den",
    emoji: "🎲",
    title: "Experimentální den",
    bodyMarkdown:
      "Jeden den nebo odpoledne, kdy děláš výhradně věci, které normálně neděláš. Nová hudba, nový žánr filmu, místo kde jsi nikdy nebyl, jídlo které normálně nejíš. Rozbíjíš autopilota.",
    orderIndex: 3,
    resourceUrl: null,
    relatedPostSlug: null,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

type CuratedRow = {
  id: string;
  slug: string;
  type: string;
  title: string;
  subtitle: string | null;
  body_markdown: string;
  curator_note: string | null;
  categories: string[] | null;
  tags: string[] | null;
  published_at: Date | string | null;
  cover_image_url: string | null;
};

function normalizePost(row: CuratedRow): CuratedPost {
  const publishedAt =
    row.published_at instanceof Date
      ? row.published_at.toISOString()
      : typeof row.published_at === "string"
      ? row.published_at
      : "";
  return {
    id: row.id,
    slug: row.slug,
    type: row.type === "digest" ? "digest" : "tip",
    title: row.title,
    subtitle: row.subtitle,
    body_markdown: row.body_markdown,
    curator_note: row.curator_note,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    published_at: publishedAt,
    cover_image_url: row.cover_image_url,
  };
}

async function loadExercises(): Promise<ExerciseWithPost[]> {
  let list: Exercise[] = [];
  try {
    list = await getAllExercises();
  } catch (error) {
    console.error("loadExercises failed:", error);
  }
  if (list.length === 0) list = FALLBACK_EXERCISES;

  const withPosts = await Promise.all(
    list.map(async (ex) => {
      if (!ex.relatedPostSlug) return { ...ex, relatedPost: null };
      try {
        const row = (await getCuratedPost(ex.relatedPostSlug)) as CuratedRow | null;
        return {
          ...ex,
          relatedPost: row ? normalizePost(row) : null,
        };
      } catch {
        return { ...ex, relatedPost: null };
      }
    })
  );

  return withPosts;
}

export default async function KoucingPage() {
  const exercises = await loadExercises();
  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">

      {/* ─── Hero — full bleed like homepage ─── */}
      <section className="relative bg-[#F8EEDB] pt-36 md:pt-48 pb-20 md:pb-24 -mt-20 animate-fade-up overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              <span className="block">Možná koučing vůbec</span>
              <span className="underline-sketch inline-block pb-3">nepotřebuješ.</span>
            </h1>
            <p className="font-display text-xl md:text-2xl font-extrabold text-foreground">
              Koučing není pro každého.
            </p>
            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Je to intenzivní práce pro lidi, co se nehýbou směrem, kam chtějí &mdash; nebo to jde moc pomalu. Hledáš vlastní tempo? V{" "}
              <Link href="/knihovna" className="text-primary font-semibold hover:opacity-80 transition-opacity">knihovně</Link>{" "}se inspiruj knihami, články a cvičeními, které ti pomůžou více žít. Zkoušel jsi vše a jsi stále zaseklý? Pojďme se potkat.
            </p>
            <div className="pt-2">
              <Link href="#rezervace" className="btn-playful text-lg" data-shape="3">
                Konzultace zdarma &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-16 md:h-20"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C120,20 200,120 360,140 C460,152 520,80 640,40 C700,15 760,10 820,25 C900,48 940,90 1020,85 C1100,80 1180,40 1280,20 C1360,6 1420,10 1440,15 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-16 md:pb-20">

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

          <HandDrawnCard
            variant={0}
            shadow={false}
            stroke="rgba(23,23,23,0.45)"
            strokeWidth={1.5}
            innerClassName="px-10 md:px-16 py-14 md:py-20 space-y-5"
          >
            <p className="text-lg text-foreground/80 leading-relaxed">
              Většinu života jsem strávil v hlavě. Plánoval, analyzoval, zvažoval &mdash; a ztrácel se v tom, místo abych žil. Poznám ten pocit: víš, jak chceš, aby tvůj život vypadal, ale místo žití ho přemýšlíš. A ta mezera mezi hlavou a životem tě vyčerpává.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Cíl je jednoduchý &mdash; přejít co nejvíc <span className="underline-playful font-semibold">z hlavy do života</span>. Ne ho dokonale promyslet, ale reálně ho žít. Koučink je nástroj, kterým ten přechod zrychluju &mdash; sobě i lidem, co se zasekli ve stejném místě.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Nejsem klasický kouč, který se jen ptá &bdquo;a co ty na to?&ldquo; Kombinuju koučink s mentoringem &mdash; když je potřeba nasměrovat, nasměruju. Když je potřeba naslouchat, naslouchám. Níže najdeš celý můj přístup krok za krokem, zdarma. Koučink je pak pojistka, že to tentokrát opravdu uděláš.
            </p>
          </HandDrawnCard>
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
            {phases.map((phase, i) => {
              const rotations = ["rotate-[-0.6deg]", "rotate-[0.5deg]", "rotate-[-0.4deg]", "rotate-[0.6deg]"];
              return (
                <HandDrawnCard
                  key={phase.n}
                  variant={i}
                  className={`group ${rotations[i % 4]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                  innerClassName="p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <HandDrawnIcon bg="#ffe4cc" variant={i} size={36}>
                      <span className="font-display font-bold text-sm">{phase.n}</span>
                    </HandDrawnIcon>
                    <h3 className="font-display text-xl font-extrabold flex-1">{phase.title}</h3>
                    <HandDrawnIcon bg="#ffe4cc" variant={i} size={44} shape="square">
                      <span className="text-xl">{phase.emoji}</span>
                    </HandDrawnIcon>
                  </div>
                  <p className="text-foreground/70 leading-relaxed text-[0.95rem]">{phase.text}</p>
                </HandDrawnCard>
              );
            })}
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
            {mindsetShifts.map((shift, i) => {
              const rotations = ["rotate-[-0.6deg]", "rotate-[0.4deg]", "rotate-[-0.3deg]", "rotate-[0.5deg]", "rotate-[-0.5deg]", "rotate-[0.7deg]"];
              return (
                <HandDrawnCard
                  key={shift.old}
                  variant={i}
                  className={`group ${rotations[i % 6]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                  innerClassName="p-6"
                >
                  <div className="flex flex-col gap-1 mb-3">
                    <p className="text-sm text-muted inline-block w-fit strike-sketch">
                      {shift.old}
                    </p>
                    <p className="font-display text-lg font-extrabold text-primary flex items-start gap-2">
                      <span className="text-primary/50 shrink-0">&rarr;</span>
                      {shift.next}
                    </p>
                  </div>
                  <p className="text-foreground/70 leading-relaxed text-[0.95rem]">{shift.text}</p>
                </HandDrawnCard>
              );
            })}
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
            {exercises.map((ex, i) => {
              const rotations = ["rotate-[-0.7deg]", "rotate-[0.5deg]", "rotate-[-0.4deg]"];
              return (
                <div key={ex.id} className="flex flex-col gap-4">
                  <HandDrawnCard
                    variant={i}
                    className={`group ${rotations[i % 3]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200 flex-1`}
                    innerClassName="p-6 h-full flex flex-col"
                  >
                    {ex.emoji && (
                      <HandDrawnIcon bg="#c6f1ec" variant={i} size={48} shape="square" className="mb-4">
                        <span className="text-2xl">{ex.emoji}</span>
                      </HandDrawnIcon>
                    )}
                    <h3 className="font-display text-lg font-extrabold mb-2">{ex.title}</h3>
                    <p className="text-foreground/70 leading-relaxed text-[0.95rem] whitespace-pre-line flex-1">
                      {ex.bodyMarkdown}
                    </p>
                    {ex.resourceUrl && (
                      <a
                        href={ex.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:opacity-80 transition-opacity"
                      >
                        Další zdroj
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </HandDrawnCard>
                  {ex.relatedPost && <FeedCard post={ex.relatedPost} />}
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* ─── Aha moment — full-bleed cream band with waves ─── */}
      <section
        className="relative bg-[#F8EEDB] py-20 md:py-28 overflow-hidden animate-fade-up"
        style={{ animationDelay: "500ms" }}
      >
        {/* Top wave — page bg eating into cream from above */}
        <svg
          aria-hidden="true"
          className="absolute top-0 left-0 w-full h-16 md:h-20 rotate-180"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C120,20 200,120 360,140 C460,152 520,80 640,40 C700,15 760,10 820,25 C900,48 940,90 1020,85 C1100,80 1180,40 1280,20 C1360,6 1420,10 1440,15 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>

        <div className="relative max-w-3xl mx-auto text-center px-6 md:px-12">
          <span
            aria-hidden="true"
            className="absolute -top-6 -left-2 md:-top-10 md:-left-6 font-display text-[8rem] md:text-[12rem] leading-none text-primary/15 select-none"
          >
            &ldquo;
          </span>
          <blockquote className="relative">
            <p className="font-display text-2xl md:text-4xl font-extrabold leading-snug mb-5">
              <span className="underline-playful">
                &bdquo;To bylo celou dobu takhle jednoduché?&ldquo;
              </span>
            </p>
            <p className="text-lg text-foreground/70">
              Ano. Není to složité. Je to těžké. A to je zásadní rozdíl.
            </p>
          </blockquote>
          <span
            aria-hidden="true"
            className="absolute -bottom-16 -right-2 md:-bottom-20 md:-right-6 font-display text-[8rem] md:text-[12rem] leading-none text-primary/15 select-none rotate-180"
          >
            &ldquo;
          </span>
        </div>

        {/* Bottom wave — page bg eating into cream from below */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-16 md:h-20"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C120,20 200,120 360,140 C460,152 520,80 640,40 C700,15 760,10 820,25 C900,48 940,90 1020,85 C1100,80 1180,40 1280,20 C1360,6 1420,10 1440,15 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-16 md:pb-20 pt-16 md:pt-20">

        {/* ─── Rezervace + Balíčky ─── */}
        <section
          className="animate-fade-up"
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
          <div id="rezervace" className="relative mb-6 scroll-mt-24">
            <HandDrawnCard
              variant={1}
              shadow={false}
              fill="#F8EEDB"
              stroke="rgba(23,23,23,0.35)"
              strokeWidth={1.25}
              innerClassName="px-7 md:px-12 py-10 md:py-14"
            >
              <span className="badge-soon absolute -top-3 left-1/2 -translate-x-1/2 !bg-[#c6f1ec] !text-[#2ba89e] !rotate-0 shadow-sm z-10">
                Zdarma &bull; bez závazku
              </span>

              <div className="space-y-2 mb-8 text-center md:text-left">
                <h3 className="font-display text-2xl md:text-3xl font-extrabold">
                  Nezávazná <span className="underline-teal">konzultace</span>
                </h3>
                <p className="text-foreground/75 leading-relaxed">
                  30 minut, během kterých projdeme tvoji situaci a zjistíme, jestli a jak ti mohu pomoct. Pokud to smysl nedává, řekneme si to rovnou.
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:gap-10 gap-8">
                <div className="flex-1 space-y-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-5xl font-extrabold text-primary">Zdarma</span>
                    <span className="text-sm text-muted">pro všechny</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      "30 minut jeden na jednoho",
                      "Projdeme tvoji situaci bez příkras",
                      "Zjistíme, jestli a jak mohu pomoct",
                      "Žádný závazek ani tlak",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 border-[#2ba89e]/40 flex items-center justify-center mt-0.5">
                          <span className="text-[#2ba89e] font-bold text-xs">&#10003;</span>
                        </span>
                        <span className="text-base text-foreground/85">{item}</span>
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
            </HandDrawnCard>
          </div>

          {/* Balíčky */}
          <div className="space-y-5 pt-2">
            <h3 className="font-display text-xl font-extrabold text-center md:text-left">Jak to vypadá prakticky</h3>
            <p className="text-muted leading-relaxed max-w-3xl text-center md:text-left">
              Pokud se po konzultaci rozhodneme pokračovat, díváme se na tvůj život jako na celek &mdash; a pracujeme na tom, co je právě teď nejdůležitější. Každé sezení má jasný výstup a konkrétní kroky k akci.
            </p>

            <div className="grid sm:grid-cols-3 gap-5 pt-1">
              {[
                { label: "Krátký sprint", count: "3", unit: "sezení", desc: "Na konkrétní problém nebo rozhodnutí." },
                { label: "Hloubková práce", count: "10", unit: "sezení", desc: "Proměna toho, jak žiješ — od porozumění po reálnou změnu." },
                { label: "Celý rok", count: "∞", unit: "průběžně", desc: "Práce na tom, co přichází — týden za týdnem." },
              ].map((opt, i) => {
                const rotations = ["rotate-[-0.5deg]", "rotate-[0.4deg]", "rotate-[-0.3deg]"];
                return (
                  <HandDrawnCard
                    key={opt.label}
                    variant={i}
                    shadow={false}
                    fill="#FFF4EB"
                    stroke="rgba(23,23,23,0.3)"
                    strokeWidth={1.25}
                    className={`group ${rotations[i]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                    innerClassName="p-5 space-y-2"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-2xl font-extrabold text-primary leading-none">{opt.count}</span>
                      <span className="text-xs text-muted">{opt.unit}</span>
                    </div>
                    <p className="font-display font-extrabold text-base text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted leading-relaxed">{opt.desc}</p>
                  </HandDrawnCard>
                );
              })}
            </div>

            <div className="rounded-2xl bg-[#E8FAF8] border border-[#2ba89e]/25 px-6 py-5 space-y-1.5">
              <p className="text-sm font-display font-extrabold text-[#2ba89e]">
                Pro prvních 10 klientů &mdash; zvýhodněná cena výměnou za hodnocení
              </p>
              <p className="text-sm text-foreground/75">
                Jedno sezení za <span className="font-semibold text-foreground">1 800 Kč</span> <span className="line-through text-foreground/35">3 000 Kč</span> &mdash; při deseti a více sezeních pak <span className="font-semibold text-foreground">1 500 Kč</span> <span className="line-through text-foreground/35">2 500 Kč</span> za sezení. Rozsah domluvíme na konzultaci.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
