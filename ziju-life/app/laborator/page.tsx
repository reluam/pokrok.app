"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const tools = [
  {
    id: "nastav-si-den",
    name: "Nastav si den",
    desc: "Konfigurátor denních rituálů s neurovědou. Sestav si vlastní ranní, denní a večerní rutinu a stáhni personalizované kartičky.",
    href: "/nastav-si-den",
    available: true,
    tag: "ADHD & fokus",
  },
  {
    id: "tvuj-kompas",
    name: "Tvůj kompas",
    desc: "Interaktivní cvičení pro nalezení životního směru a hodnot. Sám sobě ukaž, co je pro tebe důležité.",
    href: "/laborator/tvuj-kompas",
    available: false,
    tag: "Smysl & hodnoty",
  },
];

const faqs = [
  {
    q: "Co je Laboratoř?",
    a: "Laboratoř je placená sekce žiju life — sbírka interaktivních nástrojů a cvičení, které ti pomohou žít vědoměji. Žádné motivační citáty, žádné šablony. Jen funkční systémy postavené na neurověděě a psychologii.",
  },
  {
    q: "Pro koho to je?",
    a: "Pro lidi, kteří chtějí aktivně pracovat na svém životě. Nevadí ti experimentovat, zkoušet a upravovat. ADHD nebo ne — klíčem je ochota dělat to systematicky.",
  },
  {
    q: "Co dostanu?",
    a: "Přístup ke všem nástrojům v Laboratoři — teď i do budoucna. Nové nástroje přibývají průběžně. Vše je součástí jednoho předplatného.",
  },
  {
    q: "Můžu předplatné zrušit?",
    a: "Ano, kdykoliv. Přes Stripe zákaznický portál jedním klikem. Žádné podmínky, žádné výpovědní lhůty.",
  },
];

export default function LaboratorPage() {
  const router = useRouter();
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function handleBuy() {
    setBuying(true);
    setBuyError("");
    try {
      const res = await fetch("/api/laborator/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBuyError(data.error || "Něco se pokazilo.");
      }
    } catch {
      setBuyError("Nepodařilo se připojit k serveru.");
    } finally {
      setBuying(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/laborator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (data.valid) {
        router.push("/laborator/dashboard");
      } else {
        setLoginError(data.error || "Aktivní předplatné nenalezeno.");
      }
    } catch {
      setLoginError("Chyba připojení.");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFDF7]">
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-20 pb-16 text-center">
        <p className="text-xs font-bold text-accent uppercase tracking-widest mb-4">
          žiju life
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
          Laboratoř
        </h1>
        <p className="text-lg text-foreground/65 leading-relaxed mb-10 max-w-xl mx-auto">
          Místo, kde experimentuješ se svým životem. Interaktivní nástroje a
          cvičení postavené na neurověděě a psychologii — žádné motivační
          citáty, jen funkční systémy.
        </p>
        <AccessButton loading={buying} onClick={handleBuy} />
        {buyError && <p className="mt-3 text-sm text-red-500">{buyError}</p>}
        <p className="mt-4 text-xs text-foreground/35">
          490 Kč / rok · Přístup ke všem nástrojům · Zrušit lze kdykoliv
        </p>
      </section>

      {/* Nástroje */}
      <section className="max-w-3xl mx-auto px-5 pb-20">
        <h2 className="text-xl font-bold mb-6">Co teď v Laboratoři najdeš</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((t) => (
            <div
              key={t.id}
              className={`paper-card rounded-[24px] px-6 py-6 flex flex-col gap-3 ${
                !t.available ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                    {t.tag}
                  </span>
                  <p className="font-bold text-foreground mt-0.5">{t.name}</p>
                </div>
                {!t.available && (
                  <span className="text-xs font-bold px-2 py-1 bg-foreground/8 text-foreground/40 rounded-full shrink-0 whitespace-nowrap">
                    Brzy
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground/35 mt-4 text-center">
          Nové nástroje přibývají průběžně. Všechny jsou součástí jednoho
          předplatného.
        </p>
      </section>

      {/* Pricing */}
      <section className="max-w-md mx-auto px-5 pb-20">
        <div className="paper-card rounded-[32px] px-8 py-10 text-center">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">
            Předplatné
          </p>
          <p className="text-5xl font-extrabold text-foreground mb-1">
            490 Kč
          </p>
          <p className="text-sm text-foreground/50 mb-8">za rok</p>
          <AccessButton loading={buying} onClick={handleBuy} />
          {buyError && (
            <p className="mt-3 text-sm text-red-500">{buyError}</p>
          )}
          <ul className="mt-8 space-y-2 text-sm text-foreground/60 text-left">
            {[
              "Přístup ke všem nástrojům v Laboratoři",
              "Nové nástroje automaticky v ceně",
              "Zrušit lze kdykoliv přes Stripe",
              "Platba přes Stripe — karta nebo Apple Pay",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-5 pb-20">
        <h2 className="text-xl font-bold mb-6">Časté otázky</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* Returning member login */}
      <section className="max-w-md mx-auto px-5 pb-24">
        <div className="paper-card rounded-[28px] px-7 py-8">
          <p className="font-bold mb-1">Už mám přístup</p>
          <p className="text-sm text-foreground/50 mb-5">
            Zadej e-mail, na který jsi platil/a — přihlásíme tě.
          </p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="tvuj@email.cz"
              required
              className="w-full px-4 py-3 rounded-2xl border border-foreground/10
                bg-white/80 text-sm outline-none focus:border-accent/40 transition-colors"
            />
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-foreground text-white rounded-full font-semibold
                text-sm hover:bg-foreground/80 transition-colors disabled:opacity-60"
            >
              {loginLoading ? "Ověřuji…" : "Přihlásit se"}
            </button>
            {loginError && (
              <p className="text-xs text-red-500 leading-relaxed">{loginError}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

function AccessButton({
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
        "Získat přístup"
      )}
    </button>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="paper-card rounded-[20px] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
      >
        <span className="font-semibold text-sm">{q}</span>
        <span
          className={`text-foreground/40 transition-transform shrink-0 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-foreground/60 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
