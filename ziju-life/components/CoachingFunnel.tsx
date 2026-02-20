"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useBookingPopup } from "@/components/BookingPopup";

/** Oddělovač sekce ve stylu Perspective: čára – kroužek s číslem – čára */
function FunnelSectionDivider({ number }: { number: number }) {
  return (
    <div className="flex items-center justify-center gap-3 w-full py-6 sm:py-8">
      <div className="flex-1 h-px bg-black/15" />
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-bold text-lg shrink-0">
        {number}
      </span>
      <div className="flex-1 h-px bg-black/15" />
    </div>
  );
}

/** Obrázek v CTA – na celou šířku karty až do krajů; když soubor chybí, zobrazí se jen pozadí. */
function FunnelCtaImage({
  src,
  wrapperClassName = "bg-black/5",
}: {
  src: string;
  wrapperClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`block w-full aspect-[4/3] overflow-hidden flex items-center justify-center shrink-0 ${wrapperClassName}`}
    >
      {!failed && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

const STEPS = [
  {
    id: "welcome",
    type: "welcome" as const,
    title: "Začni žít life podle sebe.",
    subtitle:
      "Většinu dne neřídíš ty, ale tvoje podvědomí. Ukážu ti, jak převzít řízení a nastavit mysl, aby tě vedla, kam chceš ty. Jsi připraven/a?",
    cta: "Chci převzít řízení",
  },
  {
    id: "q1",
    type: "question" as const,
    question: "Poznáváš se v tom?",
    options: [
      "Tvůj den neřídíš ty, ale požadavky ostatních a skryté strachy.",
      "Máš všechno, co bys \"měl\" mít, ale cítíš, že ti život protéká mezi prsty.",
      "Tvá vlastní mysl je tvůj největší kritik, ne spojenec.",
      "Vidíš, jak reaguješ, ale neumíš to změnit.",
    ],
  },
  {
    id: "q2",
    type: "question" as const,
    question: "Co od koučování očekáváš?",
    options: [
      "Konkrétní kroky – chci vědět, co mám dělat.",
      "Porozumět sobě – proč reaguji tak, jak reaguji.",
      "Obojí – nejdřív porozumět, pak jednat.",
    ],
  },
  {
    id: "contact",
    type: "contact" as const,
  },
];

export default function CoachingFunnel() {
  const { openBookingPopup } = useBookingPopup() ?? {};
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStepIndex((i) => i + 1);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Vyplňte prosím platný e-mail.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          message: message.trim()
            ? `${message.trim()}\n\n--- Odpovědi z funnelu ---\n${JSON.stringify(answers, null, 0)}`
            : `Odpovědi z funnelu: ${JSON.stringify(answers)}`,
          source: "funnel",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Něco se pokazilo.");
        setLoading(false);
        return;
      }
      if (openBookingPopup) {
        openBookingPopup({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          note: message?.trim() || undefined,
        });
        setLoading(false);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-black/5">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main
        className={`flex-1 flex flex-col px-4 py-8 sm:py-12 pt-12 max-w-lg mx-auto w-full ${
          step?.type === "welcome" ? "min-h-0 overflow-y-auto" : "justify-center"
        }`}
      >
        {step?.type === "welcome" && (
          <div className="text-center pb-16">
            {/* Sekce 1: Úvod */}
            <div className="pt-4">
              <Image
                src="/ziju-life-logo.png"
                alt="Žiju life"
                width={160}
                height={64}
                className="h-14 w-auto sm:h-16 mx-auto"
                priority
              />
              <h1 className="mt-8 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {step.title}
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-foreground/80 leading-relaxed max-w-xl mx-auto">
                {step.subtitle}
              </p>
            </div>

            <FunnelSectionDivider number={1} />

            {/* Sekce 2: Jak na to */}
            <section className="text-left max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
                Jak na to
              </h2>
              <ol className="space-y-4 text-foreground/85">
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold shrink-0">1</span>
                  <span>Odpověz na pár krátkých otázek, ať vím, s čím ti mám pomoct.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold shrink-0">2</span>
                  <span>Vyplň jméno a e-mail a vyber si termín 30min sezení zdarma.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold shrink-0">3</span>
                  <span>Na videohovoru probereme tvoji situaci a další kroky.</span>
                </li>
              </ol>
            </section>

            <FunnelSectionDivider number={2} />

            {/* Sekce 3: Volba CTA */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                Jsi připraven/a?
              </h2>
              <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => setStepIndex(1)}
                  className="flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-0 text-left w-full bg-transparent"
                >
                  <FunnelCtaImage src="/form/btn-prevzit-rizeni.png" wrapperClassName="bg-white/20" />
                  <span className="w-full py-3 px-3 bg-accent text-white font-bold text-center text-base sm:text-lg">
                    Chci převzít řízení
                  </span>
                </button>
                <Link
                  href="/koucing"
                  className="flex flex-col rounded-2xl overflow-hidden border-2 border-black/15 shadow-lg hover:shadow-xl transition-all text-left w-full"
                >
                  <FunnelCtaImage src="/form/btn-rozmyslim.png" />
                  <span className="w-full py-3 px-3 bg-accent/10 text-foreground font-bold text-center text-base sm:text-lg">
                    Ještě se rozmýšlím
                  </span>
                </Link>
              </div>
            </section>

            <FunnelSectionDivider number={3} />

            {/* Sekce 4: Co z koučinku můžeš získat */}
            <section className="text-left max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
                Co z koučinku můžeš získat
              </h2>
              <ul className="space-y-3 text-foreground/85 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  <span><strong className="text-foreground">Jasno v tom, co chceš a proč</strong> – místo „mělo by se“ přijdeme na to, co je opravdu tvoje.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  <span><strong className="text-foreground">Konkrétní kroky</strong> – méně přemítání, víc akce, která tě posouvá.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  <span><strong className="text-foreground">Vědomé převzetí řízení</strong> – nad reakcemi, rozhodnutími a tím, kam směřuješ.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  <span><strong className="text-foreground">Podpora na míru</strong> – žádné univerzální manuály, řešíme tvoji situaci a tvoji cestu.</span>
                </li>
              </ul>
            </section>

            <FunnelSectionDivider number={4} />

            {/* Sekce 5: Hlavní CTA */}
            <section>
              <button
                type="button"
                onClick={() => setStepIndex(1)}
                className="w-full max-w-md mx-auto block px-6 py-4 bg-accent text-white rounded-xl font-bold text-base sm:text-lg hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
              >
                Získej 30 minutovou konzultaci zdarma
              </button>
            </section>
          </div>
        )}

        {step?.type === "question" && (
          <div className="space-y-8">
            <FunnelSectionDivider number={stepIndex + 1} />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
              {step.question}
            </h2>
            <div className="space-y-3">
              {step.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAnswer(step.id, opt)}
                  className="w-full text-left px-5 py-4 rounded-2xl border-2 border-black/10 bg-white hover:border-accent hover:bg-accent/5 transition-all font-medium text-foreground"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step?.type === "contact" && (
          <div className="space-y-6">
            <FunnelSectionDivider number={STEPS.length} />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
              Ještě krátce o vás
            </h2>
            <p className="text-foreground/70 text-center">
              Vyplňte údaje a hned poté si vyberte termín 30min sezení zdarma.
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label htmlFor="funnel-name" className="block text-sm font-medium text-foreground mb-1">
                  Jméno
                </label>
                <input
                  id="funnel-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                  placeholder="Vaše jméno"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="funnel-email" className="block text-sm font-medium text-foreground mb-1">
                  E-mail *
                </label>
                <input
                  id="funnel-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                  placeholder="vas@email.cz"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="funnel-msg" className="block text-sm font-medium text-foreground mb-1">
                  S čím vám můžu pomoct? (nepovinné)
                </label>
                <textarea
                  id="funnel-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white resize-none"
                  placeholder="Stručně..."
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <p className="text-xs text-foreground/60">
                Odesláním souhlasíte se zpracováním údajů.{" "}
                <a href="/gdpr" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                  Zásady ochrany údajů
                </a>
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-colors disabled:opacity-70"
              >
                {loading ? "Odesílám…" : "Pokračovat k výběru termínu"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
