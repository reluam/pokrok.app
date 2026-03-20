"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { icon: "📍", label: "Kde teď jsi?", desc: "Kolo života — upřímný pohled na všechny oblasti" },
  { icon: "🔋", label: "Energie & únava", desc: "Co tě dobíjí a co vysává" },
  { icon: "🧭", label: "Hodnoty & priority", desc: "Co je pro tebe skutečně důležité" },
  { icon: "🎯", label: "Co chceš", desc: "Vize a konkrétní cíle do budoucna" },
  { icon: "🚧", label: "Co tě brzdí", desc: "Přesvědčení a vzorce, které stojí v cestě" },
  { icon: "🗺️", label: "Plán", desc: "Konkrétní kroky a závazky" },
  { icon: "✅", label: "Závěr & dokument", desc: "Osobní shrnutí celé cesty" },
];

export default function AuditIntroCard({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(userEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Zadej platný e-mail, abychom mohli tvůj postup uložit.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/start-free-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Něco se nepovedlo, zkus to znovu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Chyba připojení, zkus to znovu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Header */}
          <div className="text-center space-y-1 pb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Průvodce</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Audit života</h1>
            <p className="text-base text-foreground/60 leading-relaxed max-w-xl mx-auto">
              Sedm řízených kroků, které ti pomohou zmapovat život, pojmenovat co tě brzdí a sestavit plán jak žít víc podle sebe.
            </p>
          </div>

          {/* Steps preview box */}
          <div className="paper-card rounded-[24px] px-6 py-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Co tě čeká</p>
            <ul className="space-y-2">
              {STEPS.map((step, i) => (
                <li key={step.label} className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-foreground/30 w-4">{i + 1}</span>
                    <span className="text-lg leading-none">{step.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{step.label}</p>
                    <p className="text-xs text-foreground/50 leading-snug">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* How it works box */}
          <div className="paper-card rounded-[24px] px-6 py-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Jak to funguje</p>
            <ul className="space-y-2.5">
              {[
                { icon: "💾", text: "Tvůj postup se průběžně ukládá — kdykoli se můžeš vrátit a pokračovat." },
                { icon: "📋", text: "Ke každé zastávce jsou cvičení a šablony, které tě celým krokem provedou." },
                { icon: "📄", text: "Na konci si vygeneruješ vlastní shrnutí — osobní dokument z celé cesty." },
                { icon: "🎁", text: "Zdarma. Bez karty, bez předplatného." },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-foreground/70">
                  <span className="flex-shrink-0 text-base leading-none mt-0.5">{item.icon}</span>
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Email + start box */}
          <div className="paper-card rounded-[24px] px-6 py-6 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Zadej e-mail pro uložení postupu</p>
              <p className="text-xs text-foreground/50">
                Pošleme ti odkaz, díky kterému se k auditu kdykoliv vrátíš.
              </p>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="tvuj@email.cz"
              className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
              disabled={loading}
              autoComplete="email"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              {loading ? "Připravuji…" : "Začít audit"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}
