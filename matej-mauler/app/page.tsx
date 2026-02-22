import ContactForm from "@/components/ContactForm";
import BeforeAfterGallery from "@/components/BeforeAfterGallery";
import ImageWithLightbox from "@/components/ImageWithLightbox";

export default function Home() {
  return (
    <div id="top" className="relative min-h-screen overflow-hidden">
      {/* Nebula pozadí – přelévající se barvy */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-nebula" aria-hidden="true">
        <div className="nebula-blob nebula-blob-1" />
        <div className="nebula-blob nebula-blob-2" />
        <div className="nebula-blob nebula-blob-3" />
        <div className="nebula-blob nebula-blob-4" />
        <div className="nebula-blob nebula-blob-5" />
      </div>

      <main className="relative z-10">
        {/* Navigation */}
        <header className="border-b border-black/10 px-6 py-5 md:px-12">
          <nav className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="font-[family-name:var(--font-heading)] text-sm font-600 tracking-wide text-[var(--fg)]">
              Matěj Mauler
            </span>
            <a
              href="#kontakt"
              className="rounded-full bg-black/5 px-4 py-2 text-sm font-500 text-[var(--fg)] transition hover:bg-black/10"
            >
              Kontakt
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="px-6 pt-24 pb-32 md:px-12 md:pt-36 md:pb-44">
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 font-[family-name:var(--font-heading)] text-sm font-500 uppercase tracking-[0.2em] text-[var(--accent)]">
              Služby s AI
            </p>
            <h1 className="mb-6 max-w-4xl text-5xl font-800 leading-[1.05] tracking-tight text-[var(--fg)] md:text-7xl lg:text-8xl">
              Matěj Mauler
            </h1>
            <p className="max-w-2xl text-xl text-[var(--fg-muted)] md:text-2xl">
              Tvořím moderní weby a automatizace, které šetří čas a vypadají skvěle.
              S využitím umělé inteligence dodávám řešení na míru — rychle a spolehlivě.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <a
                href="#sluzby"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-600 text-white transition hover:opacity-90"
              >
                Co nabízím
              </a>
              <a
                href="#kontakt"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 font-500 text-[var(--fg)] transition hover:border-black/25 hover:bg-black/5"
              >
                Napsat zprávu
              </a>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="sluzby" className="border-t border-black/10 px-6 py-24 md:px-12 md:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 font-[family-name:var(--font-heading)] text-sm font-500 uppercase tracking-[0.2em] text-[var(--accent)]">
              Služby
            </p>
            <h2 className="mb-16 text-4xl font-700 text-[var(--fg)] md:text-5xl">
              Co pro vás mohu udělat
            </h2>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Webové stránky */}
              <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 p-8 shadow-sm transition hover:border-[var(--accent)]/40 hover:shadow-md md:p-10">
                <div
                  className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-30"
                  style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
                />
                <div className="relative">
                  <span className="mb-4 inline-block rounded-lg bg-[var(--accent)]/15 px-3 py-1 font-[family-name:var(--font-heading)] text-sm font-600 text-[var(--accent)]">
                    Webdesign & vývoj
                  </span>
                  <h3 className="mb-4 text-2xl font-700 text-[var(--fg)] md:text-3xl">
                    Tvorba webových stránek
                  </h3>
                  <p className="text-[var(--fg-muted)]">
                    Prezentační weby, landing pages nebo komplexnější aplikace. Responzivní design,
                    rychlé načítání a přístupnost. Od návrhu po nasazení — včetně
                    úprav. Podle vašich představ.
                  </p>
                </div>
              </article>

              {/* Automatizace */}
              <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 p-8 shadow-sm transition hover:border-[var(--accent-2)]/40 hover:shadow-md md:p-10">
                <div
                  className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-30"
                  style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }}
                />
                <div className="relative">
                  <span className="mb-4 inline-block rounded-lg bg-[var(--accent-2)]/15 px-3 py-1 font-[family-name:var(--font-heading)] text-sm font-600 text-[var(--accent-2)]">
                    Automatizace
                  </span>
                  <h3 className="mb-4 text-2xl font-700 text-[var(--fg)] md:text-3xl">
                    Automatizace procesů
                  </h3>
                  <p className="text-[var(--fg-muted)]">
                    Propojení nástrojů, zpracování dat a opakující se úkoly bez ruční práce.
                    Rezervace, e-maily, reporty nebo integrace s CRM — vše nastavím tak,
                    aby systém pracoval za vás.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Dokončené projekty */}
        <section id="projekty" className="border-t border-black/10 px-6 py-24 md:px-12 md:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 font-[family-name:var(--font-heading)] text-sm font-500 uppercase tracking-[0.2em] text-[var(--accent)]">
              Portfolio
            </p>
            <h2 className="mb-16 text-4xl font-700 text-[var(--fg)] md:text-5xl">
              Dokončené projekty
            </h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Projekt 1: Školníjídelny.cz */}
              <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 p-8 shadow-sm transition hover:border-black/20 hover:shadow-md md:p-10">
                <BeforeAfterGallery
                  before={{
                    src: "/projekty/skolnijidelny-pred.png",
                    alt: "Školníjídelny.cz před rekonstrukcí",
                    label: "Před",
                  }}
                  after={{
                    src: "/projekty/skolnijidelny-po.png",
                    alt: "Školníjídelny.cz po rekonstrukci",
                    label: "Po",
                  }}
                />
                <div className="relative">
                  <span className="mb-4 inline-block rounded-lg bg-black/10 px-3 py-1 font-[family-name:var(--font-heading)] text-sm font-600 text-[var(--fg)]">
                    Web
                  </span>
                  <h3 className="mb-3 text-2xl font-700 text-[var(--fg)] md:text-3xl">
                    Školníjídelny.cz
                  </h3>
                  <p className="mb-6 text-[var(--fg-muted)]">
                    Kompletně nový web s administrací a napojením na rezervační systém.
                  </p>
                  <a
                    href="https://skolnijidelny.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-500 text-[var(--accent)] transition hover:text-[var(--accent)]/80"
                  >
                    Navštívit web
                    <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
                  </a>
                </div>
              </article>

              {/* Projekt 2: Pokrok.app */}
              <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 p-8 shadow-sm transition hover:border-black/20 hover:shadow-md md:p-10">
                <div className="mb-6">
                  <ImageWithLightbox
                    src="/projekty/pokrok.png"
                    alt="Náhled aplikace Pokrok.app"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="relative">
                  <span className="mb-4 inline-block rounded-lg bg-black/10 px-3 py-1 font-[family-name:var(--font-heading)] text-sm font-600 text-[var(--fg)]">
                    Aplikace
                  </span>
                  <h3 className="mb-3 text-2xl font-700 text-[var(--fg)] md:text-3xl">
                    Pokrok.app
                  </h3>
                  <p className="mb-6 text-[var(--fg-muted)]">
                    Komplexní webová aplikace pro plánování. Multijazyčná, s uživatelskými
                    účty a napojením na databáze.
                  </p>
                  <a
                    href="https://pokrok.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-500 text-[var(--accent)] transition hover:text-[var(--accent)]/80"
                  >
                    Navštívit web
                    <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
                  </a>
                </div>
              </article>

              {/* Projekt 3: Žiju life */}
              <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 p-8 shadow-sm transition hover:border-black/20 hover:shadow-md md:p-10">
                <div className="mb-6">
                  <ImageWithLightbox
                    src="/projekty/ziju-life.png"
                    alt="Náhled blogu Žiju life"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="relative">
                  <span className="mb-4 inline-block rounded-lg bg-black/10 px-3 py-1 font-[family-name:var(--font-heading)] text-sm font-600 text-[var(--fg)]">
                    Blog
                  </span>
                  <h3 className="mb-3 text-2xl font-700 text-[var(--fg)] md:text-3xl">
                    Žiju life
                  </h3>
                  <p className="mb-6 text-[var(--fg-muted)]">
                    Můj osobní blog, jehož součástí je i administrace.
                  </p>
                  <a
                    href="https://ziju.life"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-500 text-[var(--accent)] transition hover:text-[var(--accent)]/80"
                  >
                    Navštívit web
                    <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* About / Proč já */}
        <section className="border-t border-black/10 px-6 py-24 md:px-12 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 md:grid-cols-5 md:gap-12">
              <div className="md:col-span-2">
                <p className="mb-3 font-[family-name:var(--font-heading)] text-sm font-500 uppercase tracking-[0.2em] text-[var(--accent)]">
                  O mně
                </p>
                <h2 className="text-3xl font-700 text-[var(--fg)] md:text-4xl">
                  Proč pracovat se mnou
                </h2>
              </div>
              <div className="md:col-span-3">
                <p className="mb-6 text-lg text-[var(--fg)]">
                  Kombinuji technické znalosti s důrazem na to, aby výsledek skutečně
                  sloužil — weby, které nejen vypadají dobře, ale i konvertují, a
                  automatizace, které opravdu šetří čas.
                </p>
                <p className="text-[var(--fg-muted)]">
                  S AI pracuji jako s nástrojem: urychluje vývoj a úpravy, ale finální
                  rozhodnutí a kvalita zůstávají v lidských rukou. Rád navrhnu řešení
                  na míru vašemu projektu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Kontaktní formulář */}
        <section id="kontakt" className="border-t border-black/10 px-6 py-24 md:px-12 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-700 text-[var(--fg)] md:text-4xl">
              Pojďme na to společně
            </h2>
            <p className="mb-10 text-lg text-[var(--fg-muted)]">
              Máte nápad na web nebo chcete zautomatizovat procesy? Napište mi a
              domluvíme se na dalším kroku.
            </p>
            <ContactForm />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-black/10 px-6 py-8 md:px-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
            <span className="font-[family-name:var(--font-heading)] text-sm text-[var(--fg-muted)]">
              © {new Date().getFullYear()} Matěj Mauler
            </span>
            <a
              href="#top"
              className="text-sm text-[var(--fg-muted)] transition hover:text-[var(--fg)]"
            >
              Nahoru
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
