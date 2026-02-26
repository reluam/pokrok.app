import ProjectsCarousel from "@/components/ProjectsCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import Image from "next/image";
import CalendarBookingButton from "@/components/CalendarBookingButton";

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default function Home() {
  return (
    <div id="top" className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 bg-nebula" aria-hidden="true">
        <div className="nebula-blob nebula-blob-1" />
        <div className="nebula-blob nebula-blob-2" />
        <div className="nebula-blob nebula-blob-3" />
        <div className="nebula-blob nebula-blob-4" />
        <div className="nebula-blob nebula-blob-5" />
      </div>

      <main className="relative z-10 px-4 py-8 md:px-6 md:py-10">
        <ScrollReveal />
        {/* Rychlá navigace (hlavně pro mobilní zobrazení) */}
        <nav
          className="mt-3 mb-6 flex flex-wrap gap-2 text-sm text-[var(--fg-muted)] md:hidden"
          aria-label="Rychlá navigace po stránce"
        >
          <a
            href="#sluzby"
            className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-sm"
          >
            Služby
          </a>
          <a
            href="#projekty"
            className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-sm"
          >
            Projekty
          </a>
          <a
            href="#kontakt"
            className="rounded-full border border-white/70 bg-white/50 px-3 py-1.5 shadow-sm backdrop-blur-sm"
          >
            Kontakt
          </a>
        </nav>
        <div className="portfolio-grid mx-auto grid max-w-6xl gap-6 lg:gap-8 md:grid-cols-2">
          {/* Levý sloupec: Matěj Mauler → Dokončené projekty */}
          <div className="portfolio-column flex flex-col gap-6 lg:gap-8">
          {/* Box 1: Matěj Mauler + sociální média */}
          <div className="portfolio-card-wrap">
            <article className="portfolio-card flex flex-col rounded-2xl p-6 md:min-h-[320px] md:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-[var(--accent)]/10">
                <Image
                  src="/matej.jpg"
                  alt="Matěj Mauler"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-700 text-[var(--fg)]">Matěj Mauler</h1>
                <p className="text-sm font-500 text-[var(--fg-muted)]">
                  AI průzkumník · workshopy · kurzy · řešení
                </p>
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-700 md:text-3xl gradient-text">
              Pomáhám lidem zkrotit AI
            </h2>
            <p className="mb-6 flex-1 text-[var(--fg)] leading-relaxed">
              Zkoumám, co všechno umělá inteligence dokáže – a pak to předávám dál.
              Ukážu vám, jak AI zapojit do každodenní práce, jak vám může šetřit čas
              a jak z nápadů udělat konkrétní řešení, která skutečně používáte.
            </p>
            <div>
              <p className="mb-3 text-sm font-600 text-[var(--fg-muted)]">Najdete mě</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:matej@mattmauler.com"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5 text-[var(--fg)] transition hover:bg-[var(--accent)] hover:text-white"
                  aria-label="E-mail"
                >
                  <MailIcon />
                </a>
                <a
                  href="https://www.linkedin.com/in/matejmauler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5 text-[var(--fg)] transition hover:bg-[var(--accent)] hover:text-white"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </a>
              </div>
            </div>
          </article>
          </div>

          {/* Box 3: Projekty, o které se nikdo neprosil (AI hrátky) */}
          <div className="portfolio-card-wrap">
            <article
              id="projekty"
              className="portfolio-card flex min-h-[380px] flex-col rounded-2xl p-6 md:min-h-[420px] md:p-8"
            >
            <h2 className="text-2xl font-700 text-[var(--fg)] md:text-3xl">
              Projekty, o které se nikdo neprosil.
            </h2>
            <p className="mb-4 text-sm text-[var(--fg-muted)]">
              Moje vlastní AI experimenty, hračky a malé nástroje, které vznikly z čisté zvědavosti.
            </p>
            <div className="mt-2 flex-1">
              <ProjectsCarousel />
            </div>
          </article>
          </div>
          </div>

          {/* Pravý sloupec: Co nabízím → Napište mi */}
          <div className="portfolio-column flex flex-col gap-6 lg:gap-8">
          {/* Box 2: Co nabízím (AI workshopy, kurzy a řešení) */}
          <div className="portfolio-card-wrap">
            <article className="portfolio-card rounded-2xl p-6 md:min-h-[320px] md:p-8" id="sluzby">
            <h2 className="mb-3 text-2xl font-700 text-[var(--fg)] md:text-3xl">
              Co nabízím
            </h2>
            <p className="mb-4 text-base text-[var(--fg-muted)]">
              Pomáhám vám pochopit a využít AI v praxi – od prvních experimentů až po konkrétní systémy.
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-600 uppercase tracking-wide text-[var(--accent)]">
                Workshopy & konzultace
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-600 uppercase tracking-wide text-[var(--fg-muted)]">
                Hotová řešení
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="group rounded-2xl bg-white/10 p-5 shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/18">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/18 text-[var(--accent)]">
                    <span className="text-base font-700">W</span>
                  </div>
                  <h3 className="text-lg font-600 text-[var(--fg)]">
                    Workshopy & konzultace na míru
                  </h3>
                </div>
                <p className="text-base leading-relaxed text-[var(--fg-muted)]">
                  Praktické workshopy pro týmy i jednotlivce, kde si AI rovnou zkoušíte na
                  vlastních úkolech. Od \"jak se s tím vůbec bavit\" po konkrétní AI workflow
                  ve vašem byznysu.
                </p>
              </div>
              <div className="group rounded-2xl bg-white/10 p-5 shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/18">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/8 text-[var(--fg)]">
                    <span className="text-base font-700">R</span>
                  </div>
                  <h3 className="text-lg font-600 text-[var(--fg)]">
                    Hotová AI řešení
                  </h3>
                </div>
                <p className="text-base leading-relaxed text-[var(--fg-muted)]">
                  Když chcete výsledek, ne jen inspiraci. Pomůžu vám navrhnout a dodat
                  weby, automatizace a AI asistenty, kteří zapadnou do vašich nástrojů
                  a ušetří čas každý den.
                </p>
              </div>
            </div>
          </article>
          </div>

          {/* Box 4: Rezervace konzultace */}
          <div className="portfolio-card-wrap">
            <section
              id="kontakt"
              className="portfolio-card flex flex-col rounded-2xl p-6 md:p-8"
            >
              <h2 className="mb-3 text-2xl font-700 text-[var(--fg)] md:text-3xl">
                Rezervujte si konzultaci
              </h2>
              <p className="mb-4 text-sm text-[var(--fg-muted)]">
                30 minut zdarma, kde společně prozkoumáme, jak vám může AI konkrétně pomoct.
              </p>
              <CalendarBookingButton />
            </section>
          </div>
          </div>
        </div>

        <footer className="mt-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 rounded-2xl bg-white/25 px-5 py-5 text-sm text-[var(--fg-muted)] shadow-sm ring-1 ring-white/70 backdrop-blur-md md:flex-row">
            <span>
              © {new Date().getFullYear()} Matěj Mauler
            </span>
            <a href="#top" className="hover:text-[var(--fg)]">
              Nahoru
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
