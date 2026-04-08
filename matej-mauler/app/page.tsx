"use client";

import { FormEvent, useState, useEffect } from "react";

/* ─── Data ─── */

const benefits = [
  {
    icon: "psychology",
    title: "Decision Making",
    text: "Odstraníme rozhodovací únavu. Vaše mysl bude fungovat jako precizní seřízený procesor s minimální latencí.",
  },
  {
    icon: "hub",
    title: "Problem Solving",
    text: "Nové frameworky pro řešení komplexních výzev. Místo chaosu u vidíte strukturu a pomyslnou osu vývoje.",
  },
  {
    icon: "local_fire_department",
    title: "Biologický Tuning",
    text: "Optimalizace spánku, výživy a regenerace na základě vašich individuálních bio-markerů a dat.",
  },
];

const audience = [
  {
    num: "01",
    title: "Ambiciózní lídři",
    text: "Zakladatelé a manažeři, kteří nesou velkou zodpovědnost a potřebují špičkovou mentální kondici.",
  },
  {
    num: "02",
    title: "Kreativní profesionálové",
    text: "Lidé v tvůrčích oborech, pro které je focus a flow základním kamenem úspěchu.",
  },
  {
    num: "03",
    title: "High Performers",
    text: "Kdokoliv, kdo věří na sílu těla a mysli jako jednoho celku, který si zaslouží nejlepší možnou péči.",
  },
];

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Coaching", href: "#audience" },
  { label: "Blog", href: "#moduly" },
  { label: "Contact", href: "#kontakt" },
];

/* ─── Components ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-label text-[0.75rem] uppercase tracking-[0.2em] text-primary font-medium mb-4">
      {children}
    </p>
  );
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
  );
}

/* ─── Page ─── */

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        form.reset();
      }
    } catch {
      /* user can retry */
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ──── Navbar ──── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-nav shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <a
            href="#"
            className="font-display font-bold text-sm tracking-[0.1em] uppercase text-on-surface"
          >
            Matej Mauler
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-label text-[0.8rem] text-on-surface-muted hover:text-on-surface transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#kontakt"
              className="hidden md:inline-flex items-center gap-2 bg-primary text-white font-label text-[0.8rem] font-medium px-5 py-2 rounded-full hover:bg-primary-light transition-colors"
            >
              Get Started
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-on-surface"
              aria-label="Menu"
            >
              <Icon name={menuOpen ? "close" : "menu"} className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass-nav border-t border-outline-variant/15 px-6 py-4 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block font-label text-[0.875rem] text-on-surface-muted hover:text-on-surface"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#kontakt"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2 bg-primary text-white font-label text-[0.8rem] font-medium px-5 py-2 rounded-full"
            >
              Get Started
            </a>
          </div>
        )}
      </nav>

      <main className="flex-1 pt-16">
        {/* ──── Hero ──── */}
        <section
          id="about"
          className="relative overflow-hidden bg-surface"
        >
          {/* Lab grid texture */}
          <div className="lab-grid absolute inset-0 opacity-30 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              {/* Text */}
              <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
                <SectionLabel>Human Performance Laboratory</SectionLabel>
                <h1 className="font-display text-[3.75rem] md:text-[6rem] font-extrabold leading-[0.95] tracking-tight mb-6">
                  Matěj
                  <br />
                  Mauler
                </h1>
                <p className="text-on-surface-muted text-lg md:text-xl leading-relaxed mb-10 max-w-md">
                  Průzkumník životem.{" "}
                  <span className="italic font-display">Biohacker.</span> Kouč
                  pro ty, kteří chtějí překonat své biologické i mentální limity.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="#kontakt"
                    className="bg-primary text-white font-label text-[0.8rem] font-medium uppercase tracking-[0.1em] px-7 py-3.5 rounded-full hover:bg-primary-light transition-colors"
                  >
                    Zarezervuj si hovor zdarma
                  </a>
                  <a
                    href="#services"
                    className="inline-flex items-center gap-2 font-label text-[0.8rem] text-on-surface-muted hover:text-on-surface transition-colors"
                  >
                    <Icon name="arrow_forward" className="text-lg" />
                    Metodika
                  </a>
                </div>
              </div>

              {/* Photo placeholder */}
              <div
                className="animate-fade-up relative"
                style={{ animationDelay: "200ms" }}
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-mid">
                  {/* Replace with <Image src="/portrait.jpg" ... /> */}
                  <div className="absolute inset-0 bg-gradient-to-b from-surface-mid/50 to-surface-high/80 flex items-center justify-center">
                    <span className="font-display text-6xl font-bold text-outline-variant/40">
                      MM
                    </span>
                  </div>
                </div>

                {/* Lab accent badge */}
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-48 backdrop-blur-md bg-surface/70 rounded-xl p-3 flex items-center gap-3 editorial-shadow">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon
                      name="neurology"
                      className="text-primary text-xl"
                    />
                  </div>
                  <div>
                    <p className="font-label text-[0.65rem] uppercase tracking-[0.15em] text-on-surface-muted">
                      Focus Score
                    </p>
                    <p className="font-display font-bold text-sm text-on-surface">
                      +40%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── Co se změní ──── */}
        <section id="services" className="bg-surface-low">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-32">
            <div
              className="animate-fade-up flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16"
              style={{ animationDelay: "100ms" }}
            >
              <div>
                <SectionLabel>Laboratory Notes</SectionLabel>
                <h2 className="font-display text-[1.875rem] md:text-[2.5rem] font-bold leading-tight">
                  Co se změní po naší
                  <br className="hidden md:block" /> spolupráci?
                </h2>
              </div>
              <p className="text-on-surface-muted text-base md:text-right max-w-xs">
                Aplikujeme vědeckou preciznost na váš každodenní život a pracovní
                výkon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <div
                  key={b.title}
                  className="animate-fade-up bg-surface rounded-2xl p-8 editorial-shadow"
                  style={{ animationDelay: `${150 + i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <Icon
                      name={b.icon}
                      className="text-primary text-2xl"
                    />
                  </div>
                  <h3 className="font-display font-bold text-base uppercase tracking-[0.05em] mb-3">
                    {b.title}
                  </h3>
                  <p className="text-on-surface-muted text-[0.95rem] leading-relaxed">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Atmospheric photo break ──── */}
        <section className="relative h-[50vh] md:h-[60vh] bg-surface-mid overflow-hidden">
          {/* Replace with <Image src="/atmosphere.jpg" fill className="object-cover" /> */}
          <div className="absolute inset-0 bg-gradient-to-b from-on-surface/5 to-on-surface/20 flex items-center justify-center">
            <p className="font-label text-[0.75rem] uppercase tracking-[0.2em] text-on-surface-muted/60">
              Fotografie
            </p>
          </div>
        </section>

        {/* ──── Pro koho ──── */}
        <section id="audience" className="bg-surface">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              {/* Left — photo placeholder */}
              <div
                className="animate-fade-up hidden md:block"
                style={{ animationDelay: "0ms" }}
              >
                <div className="aspect-[4/5] rounded-2xl bg-surface-mid overflow-hidden">
                  {/* Replace with <Image /> */}
                  <div className="w-full h-full bg-gradient-to-br from-surface-mid to-surface-high" />
                </div>
              </div>

              {/* Right — content */}
              <div
                className="animate-fade-up"
                style={{ animationDelay: "100ms" }}
              >
                <SectionLabel>Target Audience</SectionLabel>
                <h2 className="font-display text-[1.875rem] md:text-[2.5rem] font-bold leading-tight mb-12">
                  Pro ty, kteří chtějí víc
                  <br className="hidden md:block" /> než jen průměr.
                </h2>

                <div className="space-y-10">
                  {audience.map((a) => (
                    <div key={a.num} className="flex gap-5">
                      <span className="font-display font-bold text-primary text-lg shrink-0 mt-0.5">
                        {a.num}
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-base mb-1 italic">
                          {a.title}
                        </h3>
                        <p className="text-on-surface-muted text-[0.95rem] leading-relaxed">
                          {a.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── Digitální moduly ──── */}
        <section id="moduly" className="bg-surface-low">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-32">
            <div className="text-center mb-14 animate-fade-up" style={{ animationDelay: "0ms" }}>
              <SectionLabel>Subversion</SectionLabel>
              <h2 className="font-display text-[1.875rem] md:text-[2.5rem] font-bold">
                Moje digitální moduly
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Substack */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="animate-fade-up group bg-surface rounded-2xl p-7 editorial-shadow hover:scale-[1.02] transition-transform"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-on-surface-muted">
                    Research Module
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="article" className="text-primary text-lg" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Substack</h3>
                <p className="text-on-surface-muted text-[0.9rem] leading-relaxed mb-5">
                  Pravidelné dávky vědecky podložených informací o dlouhověkosti, výkonu a mentálním nastavení.
                </p>
                <span className="inline-flex items-center gap-2 font-label text-[0.75rem] uppercase tracking-[0.15em] text-primary font-medium group-hover:gap-3 transition-all">
                  Prozkoumat archiv
                  <Icon name="arrow_forward" className="text-sm" />
                </span>
              </a>

              {/* Žiju.life */}
              <a
                href="https://ziju.life"
                target="_blank"
                rel="noopener noreferrer"
                className="animate-fade-up group bg-surface rounded-2xl p-7 editorial-shadow hover:scale-[1.02] transition-transform"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-on-surface-muted">
                    Lifestyle Platform
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="spa" className="text-primary text-lg" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Žiju.life</h3>
                <p className="text-on-surface-muted text-[0.9rem] leading-relaxed mb-5">
                  Můj hlavní projekt: zaměřený na holistický přístup ke zdraví, životu.life v moderním světě.
                </p>
                <span className="inline-flex items-center gap-2 font-label text-[0.75rem] uppercase tracking-[0.15em] text-primary font-medium group-hover:gap-3 transition-all">
                  Navštívit platformu
                  <Icon name="arrow_forward" className="text-sm" />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ──── Kontakt / Rezervace ──── */}
        <section id="kontakt" className="bg-surface">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-32">
            <div
              className="animate-fade-up max-w-2xl mx-auto bg-surface-low rounded-3xl p-8 md:p-14 editorial-shadow"
              style={{ animationDelay: "0ms" }}
            >
              <div className="text-center mb-10">
                <SectionLabel>Rezervace hovoru</SectionLabel>
                <h2 className="font-display text-[1.875rem] md:text-[2.25rem] font-bold mb-3">
                  Rezervace hovoru
                </h2>
                <p className="text-on-surface-muted text-base">
                  Prvních 30 minut konzultace je zdarma. Podíváme se na tvých cílech a
                  uvidíme, jestli si sedíme.
                </p>
              </div>

              {submitted ? (
                <div className="bg-surface rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name="check_circle" className="text-primary text-3xl" />
                  </div>
                  <p className="font-display text-xl font-bold mb-1">Díky!</p>
                  <p className="text-on-surface-muted text-sm">
                    Ozvu se co nejdřív.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block font-label text-[0.7rem] uppercase tracking-[0.15em] text-on-surface-muted mb-2"
                      >
                        Jméno a příjmení
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Jan Novák"
                        required
                        className="w-full border border-outline-variant/30 bg-surface rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-muted/40"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block font-label text-[0.7rem] uppercase tracking-[0.15em] text-on-surface-muted mb-2"
                      >
                        E-mail
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="jan@example.cz"
                        required
                        className="w-full border border-outline-variant/30 bg-surface rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-muted/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block font-label text-[0.7rem] uppercase tracking-[0.15em] text-on-surface-muted mb-2"
                    >
                      V čem ti můžu pomoct?
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="Stručně popiš svou aktuální výzvu..."
                      className="w-full border border-outline-variant/30 bg-surface rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-on-surface-muted/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-primary text-white font-label text-[0.8rem] font-medium uppercase tracking-[0.12em] px-8 py-4 rounded-full hover:bg-primary-light transition-colors disabled:opacity-60"
                  >
                    {sending
                      ? "Odesílám..."
                      : "Odeslat nezávaznou poptávku"}
                  </button>
                </form>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[0.8rem] text-on-surface-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="verified" className="text-primary text-base" />
                  100% konfidencialita
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="event_available" className="text-primary text-base" />
                  Volné termíny příští týden
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ──── Footer ──── */}
      <footer className="bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
          <div className="text-center mb-10">
            <p className="font-display font-extrabold text-2xl tracking-[0.08em] uppercase mb-6">
              Matej Mauler
            </p>
            <div className="w-8 h-px bg-outline-variant mx-auto" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            {["Privacy Policy", "Terms of Service", "Booking Inquiry", "Certificates"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="font-label text-[0.7rem] uppercase tracking-[0.15em] text-on-surface-muted hover:text-on-surface transition-colors"
                >
                  {label}
                </a>
              )
            )}
          </div>

          <p className="text-center text-[0.75rem] text-on-surface-muted/60 leading-relaxed">
            &copy; 2026 Matěj Mauler. All Rights Reserved. Autentické
            biohacking.
            <br />
            In Soma Veri Summitas.
          </p>

          {/* Scroll to top */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center hover:border-primary transition-colors"
              aria-label="Scroll to top"
            >
              <Icon name="arrow_upward" className="text-on-surface-muted text-lg" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
