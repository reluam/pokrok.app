"use client";

import { useState } from "react";
import { featuredBuild, ritualsById, SLOT_LABELS } from "@/data/adhdRituals";

const benefits = [
  {
    icon: "🧠",
    title: "Rituály s vědeckým základem",
    desc: "Každý rituál má 2 věty neurovědy — víš PROČ to děláš, ne jen co.",
  },
  {
    icon: "🎛️",
    title: "Konfigurátor šitý na míru",
    desc: "Vybereš si rituály do ranní, denní a večerní rutiny. Max 5 na slot — méně je více.",
  },
  {
    icon: "📄",
    title: "PDF kartičky ke stažení",
    desc: "Vytiskneš si a položíš vedle postele. Systém funguje bez obrazovky.",
  },
  {
    icon: "🎥",
    title: "Přístup k videím",
    desc: "4 pilíře systému vysvětlené ve videích. Proč systémy fungují líp než motivace.",
  },
];

const steps = [
  {
    num: "01",
    title: "Zodpovíš 5 otázek",
    desc: "Onboarding, který pochopí tvůj den — vstávání, pohyb, největší výzvy.",
  },
  {
    num: "02",
    title: "Podíváš se na 3 videa",
    desc: "Jak ADHD mozek funguje. Proč systém > motivace. Čtyři pilíře.",
  },
  {
    num: "03",
    title: "Sestavíš si rutinu",
    desc: "Z menu rituálů vyberete do tří slotů. App tě ohlídá, ať nepřetížíš.",
  },
  {
    num: "04",
    title: "Vidíš preview",
    desc: "Tři kartičky — ranní, denní, večerní. Přesně jak budou vypadat.",
  },
  {
    num: "05",
    title: "Stáhneš PDF",
    desc: "Vytiskneš, přilepíš na zeď nebo položíš vedle postele. Hotovo.",
  },
];

export default function SystemPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBuy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/system/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Něco se pokazilo. Zkus to znovu.");
      }
    } catch {
      setError("Nepodařilo se připojit k serveru.");
    } finally {
      setLoading(false);
    }
  }

  const previewSlots: Array<{ slot: "morning" | "daily" | "evening"; ids: string[] }> = [
    { slot: "morning", ids: featuredBuild.morning },
    { slot: "daily", ids: featuredBuild.daily },
    { slot: "evening", ids: featuredBuild.evening },
  ];

  return (
    <main className="min-h-screen bg-[#FDFDF7]">
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-20 pb-16 text-center">
        <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
          Pro lidi s ADHD
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-6">
          Nastav si systém,{" "}
          <span className="text-accent">který funguje</span>{" "}
          pro ADHD mozek.
        </h1>
        <p className="text-lg text-foreground/70 mb-10 max-w-xl mx-auto">
          Žádné pastelové habity, žádný guilt-tripping. Jen rituály s vědeckým základem,
          které si sám nakonfiguruješ — a stáhneš jako kartičky.
        </p>
        <BuyButton loading={loading} onClick={handleBuy} />
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-4 text-xs text-foreground/40">
          Jednorázová platba · Okamžitý přístup · Žádné předplatné
        </p>
      </section>

      {/* Co dostaneš */}
      <section className="max-w-3xl mx-auto px-5 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Co dostaneš</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="paper-card rounded-[24px] px-6 py-6 flex gap-4 items-start"
            >
              <span className="text-3xl mt-0.5 shrink-0">{b.icon}</span>
              <div>
                <p className="font-bold text-foreground mb-1">{b.title}</p>
                <p className="text-sm text-foreground/60 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="max-w-2xl mx-auto px-5 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Jak to funguje</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex gap-5 items-start paper-card rounded-[20px] px-6 py-5"
            >
              <span className="text-2xl font-black text-accent/30 shrink-0 w-10">
                {s.num}
              </span>
              <div>
                <p className="font-bold text-foreground mb-1">{s.title}</p>
                <p className="text-sm text-foreground/60 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preview kartiček */}
      <section className="max-w-4xl mx-auto px-5 pb-20">
        <h2 className="text-2xl font-bold text-center mb-3">
          Ukázka kartiček
        </h2>
        <p className="text-center text-sm text-foreground/50 mb-10">
          Tohle je Matějův systém — ty si sestavíš svůj.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {previewSlots.map(({ slot, ids }) => {
            const rituals = ids
              .map((id) => ritualsById[id])
              .filter(Boolean);
            const totalMin = rituals.reduce((s, r) => s + r.duration_min, 0);
            return (
              <div
                key={slot}
                className="paper-card rounded-[24px] overflow-hidden"
              >
                <div className="bg-foreground px-5 py-4">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                    {SLOT_LABELS[slot]}
                  </p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {totalMin} min celkem
                  </p>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {rituals.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="w-4 h-4 rounded border border-foreground/20 shrink-0" />
                      <span className="text-foreground/80">{r.name}</span>
                      {r.duration_min > 0 && (
                        <span className="ml-auto text-foreground/40 text-xs shrink-0">
                          {r.duration_min} min
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-foreground/5 px-5 py-3">
                  <p className="text-xs text-foreground/30 italic">
                    Dnes nemusí být dokonalý den.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA znovu */}
      <section className="max-w-xl mx-auto px-5 pb-24 text-center">
        <div className="paper-card rounded-[32px] px-8 py-10">
          <p className="text-2xl font-extrabold mb-3">Připravený začít?</p>
          <p className="text-foreground/60 text-sm mb-8 leading-relaxed">
            10 minut konfigurace. Kartičky na celý rok.
          </p>
          <BuyButton loading={loading} onClick={handleBuy} />
          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-5 text-xs text-foreground/40">
            Jednorázová platba 490 Kč · Stripe · Bezpečná platba
          </p>
        </div>
      </section>
    </main>
  );
}

function BuyButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white
        rounded-full font-bold text-base hover:bg-accent-hover transition-colors
        disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Připravuji platbu…
        </>
      ) : (
        "Koupit za 490 Kč"
      )}
    </button>
  );
}
