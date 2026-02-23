import ContactForm from "@/components/ContactForm";
import ProjectsCarousel from "@/components/ProjectsCarousel";

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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:gap-8">
          {/* Box 1: Matěj Mauler + sociální média */}
          <article className="portfolio-card flex flex-col rounded-2xl p-6 md:min-h-[320px] md:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xl font-700 text-[var(--accent)]">
                MM
              </div>
              <div>
                <h1 className="text-xl font-700 text-[var(--fg)]">Matěj Mauler</h1>
                <p className="text-sm font-500 text-[var(--fg-muted)]">
                  Služby s AI · Weby & automatizace
                </p>
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-700 text-[var(--fg)] md:text-3xl">
              Ahoj, vítej na mém webu!
            </h2>
            <p className="mb-6 flex-1 text-[var(--fg)] leading-relaxed">
              Tvořím moderní weby a automatizace, které šetří čas a vypadají skvěle.
              S využitím umělé inteligence dodávám řešení na míru — rychle a spolehlivě.
              Kombinuji technické znalosti s důrazem na to, aby výsledek skutečně sloužil.
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

          {/* Box 2: Co nabízím (služby) */}
          <article className="portfolio-card rounded-2xl p-6 md:min-h-[320px] md:p-8" id="sluzby">
            <h2 className="mb-3 text-2xl font-700 text-[var(--fg)] md:text-3xl">
              Co nabízím
            </h2>
            <p className="mb-4 text-[var(--fg-muted)]">
              Pomáhám vám od nápadu po hotové řešení – od prvního návrhu až po spuštění a automatizaci.
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-600 uppercase tracking-wide text-[var(--accent)]">
                Webové stránky
              </span>
              <span className="rounded-full bg-[var(--accent-2)]/10 px-3 py-1 text-xs font-600 uppercase tracking-wide text-[var(--accent-2)]">
                Automatizace
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-600 uppercase tracking-wide text-[var(--fg-muted)]">
                AI v praxi
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="group rounded-2xl bg-white/10 p-4 shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/18">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/18 text-[var(--accent)]">
                    <span className="text-sm font-700">W</span>
                  </div>
                  <h3 className="text-sm font-600 text-[var(--fg)]">
                    Tvorba webových stránek
                  </h3>
                </div>
                <p className="text-xs text-[var(--fg-muted)]">
                  Prezentační weby, landing pages i komplexnější aplikace. Důraz na rychlost,
                  responzivitu a čitelnost – aby váš web nejen vypadal dobře, ale i plnil cíle.
                </p>
              </div>
              <div className="group rounded-2xl bg-white/10 p-4 shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/18">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-2)]/18 text-[var(--accent-2)]">
                    <span className="text-sm font-700">A</span>
                  </div>
                  <h3 className="text-sm font-600 text-[var(--fg)]">
                    Automatizace procesů
                  </h3>
                </div>
                <p className="text-xs text-[var(--fg-muted)]">
                  Propojení nástrojů, zpracování dat a rutina bez ruční práce. Rezervace, e-maily,
                  reporty nebo integrace s CRM – nastavím tak, aby systém pracoval za vás.
                </p>
              </div>
            </div>
          </article>

          {/* Box 3: Dokončené projekty (přepínání šipkama) */}
          <article className="portfolio-card flex min-h-[380px] flex-col rounded-2xl p-6 md:min-h-[420px] md:p-8">
            <h2 className="text-2xl font-700 text-[var(--fg)] md:text-3xl">
              Dokončené projekty
            </h2>
            <p className="mb-4 text-sm text-[var(--fg-muted)]">
              Školníjídelny.cz · Pokrok.app · Žiju life
            </p>
            <div className="mt-2 flex-1">
              <ProjectsCarousel />
            </div>
          </article>

          {/* Box 4: Kontaktní formulář */}
          <section id="kontakt" className="portfolio-card flex min-h-[380px] flex-col rounded-2xl p-6 md:min-h-[420px] md:p-8">
            <h2 className="mb-2 text-2xl font-700 text-[var(--fg)] md:text-3xl">
              Napište mi
            </h2>
            <p className="mb-6 text-sm text-[var(--fg-muted)]">
              Vyplňte formulář a ozvu se vám co nejdříve, nejpozději do 48 hodin.
            </p>
            <div className="flex-1">
              <ContactForm />
            </div>
          </section>
        </div>

        <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-8 md:flex-row">
          <span className="text-sm text-[var(--fg-muted)]">
            © {new Date().getFullYear()} Matěj Mauler
          </span>
          <a href="#top" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
            Nahoru
          </a>
        </footer>
      </main>
    </div>
  );
}
