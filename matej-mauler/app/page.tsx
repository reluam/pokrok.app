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

function Icon({ name, size = 24, className = "" }: { name: string; size?: number; className?: string }) {
  const s = { width: size, height: size };
  const stroke = { fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "arrow_forward":
      return <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
    case "arrow_upward":
      return <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case "menu":
      return <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "close":
      return <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case "psychology":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M13 3c-1.06 0-2.05.29-2.91.78C9.22 4.26 8.5 5.04 8.02 6H7c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2s.9 2 2 2v2c0 1.1.9 2 2 2h1.02c.48.96 1.2 1.74 2.07 2.22.86.49 1.85.78 2.91.78V18c-1.66 0-3-1.34-3-3v-1h1v-4h-1V9c0-1.66 1.34-3 3-3zm2 0v2c1.66 0 3 1.34 3 3v1h-1v4h1v1c0 1.66-1.34 3-3 3v2c1.06 0 2.05-.29 2.91-.78.87-.48 1.59-1.26 2.07-2.22H17c1.1 0 2-.9 2-2v-2c1.1 0 2-.9 2-2s-.9-2-2-2V8c0-1.1-.9-2-2-2h-1.02c-.48-.96-1.2-1.74-2.07-2.22A5.9 5.9 0 0 0 15 3z" /></svg>;
    case "hub":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2a3 3 0 0 0-2.83 4H6.5A2.5 2.5 0 0 0 4 8.5v.67A3 3 0 0 0 2 12a3 3 0 0 0 2 2.83v.67A2.5 2.5 0 0 0 6.5 18h2.67A3 3 0 0 0 12 20a3 3 0 0 0 2.83-2H17.5a2.5 2.5 0 0 0 2.5-2.5v-.67A3 3 0 0 0 22 12a3 3 0 0 0-2-2.83V8.5A2.5 2.5 0 0 0 17.5 6h-2.67A3 3 0 0 0 12 4V2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-6 4.5A.5.5 0 0 1 6.5 10h3V8h5v2h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3v2h-5v-2h-3a.5.5 0 0 1-.5-.5z" /></svg>;
    case "local_fire_department":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 12.9a2.13 2.13 0 0 0-2.13 2.13c0 .83.48 1.55 1.18 1.89.2.1.42.17.66.2l.29.01c1.18 0 2.13-.96 2.13-2.1 0-.7-.34-1.32-.87-1.71L12 12.9zM16 6l-.44.55C14.38 8.02 12 7.19 12 5.3V2S4 7 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-2.96-1.61-5.62-4-7z" /></svg>;
    case "neurology":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M13 3c-.55 0-1.08.07-1.58.2a5.96 5.96 0 0 0-2.41 1.3A3.99 3.99 0 0 0 7 8v2a3 3 0 0 0 0 4v2a4 4 0 0 0 2.01 3.46A5.96 5.96 0 0 0 13 21v-2a4 4 0 0 1-4-4v-1h1v-4h-1V9a4 4 0 0 1 4-4zm2 0v2a4 4 0 0 1 4 4v1h-1v4h1v1a4 4 0 0 1-4 4v2a5.96 5.96 0 0 0 3.99-1.54A3.99 3.99 0 0 0 21 16v-2a3 3 0 0 0 0-4V8a3.99 3.99 0 0 0-2.01-3.46A5.96 5.96 0 0 0 15 3z" /></svg>;
    case "article":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>;
    case "spa":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M8.55 12a6.97 6.97 0 0 1 3.46-6.04 6.97 6.97 0 0 1 3.46 6.04 6.97 6.97 0 0 1-3.46 6.04A6.97 6.97 0 0 1 8.55 12zM12 2C9.27 4.72 7.56 8.15 7.56 12s1.71 7.28 4.44 10c2.73-2.72 4.44-6.15 4.44-10S14.73 4.72 12 2zM2.06 12c0 3.07 1.14 5.88 3 8.01C6.87 18.3 8 15.32 8 12s-1.13-6.3-2.94-8.01a12.83 12.83 0 0 0-3 8.01zm13.94 0c0 3.32 1.13 6.3 2.94 8.01A12.83 12.83 0 0 0 21.94 12c0-3.07-1.14-5.88-3-8.01C17.13 5.7 16 8.68 16 12z" /></svg>;
    case "check_circle":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>;
    case "verified":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="m23 12-2.44-2.79.34-3.69-3.61-.82L15.4 1.5 12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5 12 21.04l3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.8 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.34z" /></svg>;
    case "event_available":
      return <svg {...s} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M16.53 11.06 15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" /></svg>;
    default:
      return null;
  }
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
              <Icon name={menuOpen ? "close" : "menu"} size={24} />
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
                    <Icon name="arrow_forward" size={18} />
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
                      size={20}
                      className="text-primary"
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
                      size={24}
                      className="text-primary"
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
                    <Icon name="article" size={18} className="text-primary" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Substack</h3>
                <p className="text-on-surface-muted text-[0.9rem] leading-relaxed mb-5">
                  Pravidelné dávky vědecky podložených informací o dlouhověkosti, výkonu a mentálním nastavení.
                </p>
                <span className="inline-flex items-center gap-2 font-label text-[0.75rem] uppercase tracking-[0.15em] text-primary font-medium group-hover:gap-3 transition-all">
                  Prozkoumat archiv
                  <Icon name="arrow_forward" size={14} />
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
                    <Icon name="spa" size={18} className="text-primary" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Žiju.life</h3>
                <p className="text-on-surface-muted text-[0.9rem] leading-relaxed mb-5">
                  Můj hlavní projekt: zaměřený na holistický přístup ke zdraví, životu.life v moderním světě.
                </p>
                <span className="inline-flex items-center gap-2 font-label text-[0.75rem] uppercase tracking-[0.15em] text-primary font-medium group-hover:gap-3 transition-all">
                  Navštívit platformu
                  <Icon name="arrow_forward" size={14} />
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
                    <Icon name="check_circle" size={30} className="text-primary" />
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
                  <Icon name="verified" size={16} className="text-primary" />
                  100% konfidencialita
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="event_available" size={16} className="text-primary" />
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
              <Icon name="arrow_upward" size={18} className="text-on-surface-muted" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
