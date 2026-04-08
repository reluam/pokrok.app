"use client";

import { FormEvent, useState } from "react";

const benefits = [
  {
    title: "Rozhodnější decision making",
    text: "Méně přemýšlení v kruzích, víc jasnosti v klíčových momentech.",
  },
  {
    title: "Kreativnější problem solving",
    text: "Když přestaneš reagovat automaticky, začneš vidět věci jinak.",
  },
  {
    title: "Větší smysl v životě i v práci",
    text: "Ne jako abstraktní pocit, ale jako konkrétní kotva ve dnech.",
  },
  {
    title: "Snadnější zvládání těžkých věcí",
    text: "Ne tím, že zmizí, ale tím, že přestaneš bojovat sám se sebou.",
  },
  {
    title: "Rychlejší odbourání stresu",
    text: "Systém místo náhody.",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.12em] text-accent font-medium mb-6">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div className="flex justify-center py-0">
      <div className="w-10 h-px bg-divider" />
    </div>
  );
}

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

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
      // silent fail — user can retry
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="max-w-[640px] mx-auto px-6 py-20 md:py-20">
        {/* Hero */}
        <section
          className="animate-fade-up pb-16"
          style={{ animationDelay: "0ms" }}
        >
          <SectionLabel>Osobní koučink</SectionLabel>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight mb-3">
            Matěj Mauler
          </h1>
          <p className="font-serif text-xl md:text-2xl text-muted italic mb-6">
            Průzkumník životem
          </p>
          <p className="text-muted leading-relaxed mb-8 text-[15px]">
            Vědomé žití není duchovní koncept. Je to praktická dovednost, která
            mění způsob, jakým přemýšlíš, rozhoduješ se a žiješ.
          </p>
          <a
            href="#kontakt"
            className="inline-block bg-accent text-white text-sm font-medium px-6 py-3 rounded-sm hover:opacity-90 transition-opacity"
          >
            Zarezervuj si hovor zdarma
          </a>
        </section>

        <Divider />

        {/* Co se změní */}
        <section
          className="animate-fade-up py-16"
          style={{ animationDelay: "100ms" }}
        >
          <SectionLabel>Co to přináší</SectionLabel>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-10">
            Co se změní
          </h2>
          <div className="space-y-6">
            {benefits.map((b) => (
              <div key={b.title} className="border-l-2 border-accent/40 pl-5">
                <h3 className="text-accent font-medium text-[15px] mb-1">
                  {b.title}
                </h3>
                <p className="text-muted text-[15px] leading-relaxed">
                  {b.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* Pro koho */}
        <section
          className="animate-fade-up py-16"
          style={{ animationDelay: "200ms" }}
        >
          <SectionLabel>Pro koho to je</SectionLabel>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-6">
            Pro koho to je
          </h2>
          <p className="text-muted leading-relaxed text-[15px]">
            Pro lidi, kteří kariérně fungují — ale někde po cestě ztratili
            pocit, že to celé dává smysl. Execs, founderové, manažeři. Lidi,
            kteří mají výsledky, ale chtějí víc než jen výsledky.
          </p>
        </section>

        <Divider />

        {/* Kde mě najdeš */}
        <section
          className="animate-fade-up py-16"
          style={{ animationDelay: "300ms" }}
        >
          <SectionLabel>Kde mě najdeš</SectionLabel>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-8">
            Kde mě najdeš
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-divider rounded-sm p-5 hover:border-accent/60 transition-colors"
            >
              <h3 className="font-serif font-medium mb-1">
                Matějův zápisník
              </h3>
              <p className="text-[13px] text-accent mb-2">Substack</p>
              <p className="text-muted text-[14px] leading-relaxed">
                Píšu o tom, jaké to je žít.
              </p>
            </a>
            <a
              href="https://ziju.life"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-divider rounded-sm p-5 hover:border-accent/60 transition-colors"
            >
              <h3 className="font-serif font-medium mb-1">Žiju.life</h3>
              <p className="text-[13px] text-accent mb-2">Web</p>
              <p className="text-muted text-[14px] leading-relaxed">
                Nástroje a průvodci pro vědomý život.
              </p>
            </a>
          </div>
        </section>

        <Divider />

        {/* Kontakt */}
        <section
          id="kontakt"
          className="animate-fade-up py-16"
          style={{ animationDelay: "400ms" }}
        >
          <SectionLabel>Kontakt</SectionLabel>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3">
            Zarezervuj si hovor zdarma
          </h2>
          <p className="text-muted leading-relaxed text-[15px] mb-8">
            30 minut. Zjistíme, jestli má smysl se potkat. Bez tlaku.
          </p>

          {submitted ? (
            <div className="bg-accent-light rounded-sm p-6 text-center">
              <p className="font-serif text-lg font-medium mb-1">Díky!</p>
              <p className="text-muted text-[14px]">Ozvu se co nejdřív.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-[13px] text-muted mb-1"
                >
                  Jméno
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full border border-divider bg-transparent rounded-sm px-4 py-2.5 text-[15px] focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] text-muted mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full border border-divider bg-transparent rounded-sm px-4 py-2.5 text-[15px] focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-[13px] text-muted mb-1"
                >
                  Krátce o sobě
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full border border-divider bg-transparent rounded-sm px-4 py-2.5 text-[15px] focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="bg-accent text-white text-sm font-medium px-6 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {sending ? "Odesílám..." : "Odeslat"}
              </button>
            </form>
          )}

          <div className="mt-8 text-[14px] text-muted">
            <p>
              Nebo napiš na{" "}
              <a
                href="mailto:matej@matejmauler.com"
                className="text-accent hover:underline"
              >
                matej@matejmauler.com
              </a>{" "}
              &middot; Instagram{" "}
              <a
                href="https://instagram.com/zijulife"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                @zijulife
              </a>
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-divider">
        <div className="max-w-[640px] mx-auto px-6 py-8 text-center text-[13px] text-muted">
          &copy; 2026 Matěj Mauler &middot;{" "}
          <a
            href="https://ziju.life"
            className="hover:text-accent transition-colors"
          >
            ziju.life
          </a>
        </div>
      </footer>
    </main>
  );
}
