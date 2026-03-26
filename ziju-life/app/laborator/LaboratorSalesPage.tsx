"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const faqs = [
  {
    q: "Co je Laboratoř?",
    a: "Sada interaktivních nástrojů a cvičení, které ti pomůžou poskládat si vlastní návod na život. Žádné přednášky, žádné čtení — procházíš cvičeními sám, ve svém tempu.",
  },
  {
    q: "Pro koho to je?",
    a: "Pro tebe, pokud: vyzkoušel/a jsi pár cest, ale žádná nebyla tvoje. Víš, kam chceš dojít, ale ta mezera mezi vizí a realitou tě ochromuje. Nebo máš pocit, že ostatní to zvládají přirozeně — jen ty ne.",
  },
  {
    q: "Co dostanu?",
    a: "Přístup ke všem nástrojům v Laboratoři — teď i do budoucna. Každý nástroj tě provede konkrétním tématem (směr, hodnoty, návyky) a na konci máš jasný výstup, se kterým můžeš pracovat dál.",
  },
  {
    q: "Můžu předplatné zrušit?",
    a: "Ano, kdykoliv. Přes Stripe zákaznický portál jedním klikem. Žádné podmínky, žádné výpovědní lhůty.",
  },
];

// ── Magic link modal ──────────────────────────────────────────────────────────

type MagicState = "idle" | "loading" | "sent" | "error";

function MagicLinkModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<MagicState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: "/laborator/dashboard" }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("sent");
      } else {
        setErrorMsg(data.error || "Nepodařilo se odeslat e-mail.");
        setState("error");
      }
    } catch {
      setErrorMsg("Chyba připojení. Zkus to znovu.");
      setState("error");
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm paper-card rounded-[28px] px-7 py-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-foreground/30 hover:text-foreground/60 text-xl leading-none"
          aria-label="Zavřít"
        >
          ×
        </button>

        {state === "sent" ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <p className="font-extrabold text-lg mb-2">Zkontroluj e-mail</p>
            <p className="text-sm text-foreground/55 leading-relaxed">
              Poslali jsme odkaz na <strong>{email}</strong>.<br />
              Odkaz platí 15 minut.
            </p>
            <button
              onClick={onClose}
              className="mt-6 text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Zavřít
            </button>
          </div>
        ) : (
          <>
            <p className="font-extrabold text-lg mb-1">Přihlásit se</p>
            <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
              Zadej e-mail svého účtu — pošleme ti přihlašovací odkaz.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
                placeholder="tvuj@email.cz"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-foreground/10
                  bg-white text-sm outline-none focus:border-accent/40 transition-colors"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full py-3 bg-accent text-white rounded-full font-bold
                  text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {state === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Odesílám…
                  </span>
                ) : (
                  "Poslat odkaz →"
                )}
              </button>
              {(state === "error") && errorMsg && (
                <p className="text-xs text-red-500 leading-relaxed">{errorMsg}</p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page content (needs useSearchParams) ─────────────────────────────────────

function LaboratorContent() {
  const searchParams = useSearchParams();
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [showMagic, setShowMagic] = useState(false);
  const [expiredBanner, setExpiredBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("magic") === "expired") {
      setExpiredBanner(true);
    }
  }, [searchParams]);

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

  return (
    <main className="min-h-screen bg-[#FDFDF7]">
      {expiredBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
          Přihlašovací odkaz vypršel — pošleme ti nový.{" "}
          <button
            onClick={() => setShowMagic(true)}
            className="font-semibold underline hover:no-underline"
          >
            Zkusit znovu
          </button>
        </div>
      )}

      {showMagic && <MagicLinkModal onClose={() => setShowMagic(false)} />}

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-20 pb-16 text-center">
        <p className="text-xs font-bold text-accent uppercase tracking-widest mb-4">
          žiju life
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
          Laboratoř
        </h1>
        <p className="text-lg text-foreground/65 leading-relaxed mb-10 max-w-xl mx-auto">
          Místo, kde si vytvoříš vlastní návod na život. Cizí knížky a
          frameworky ti nefungují, protože nikdo jiný neví, co je důležité pro
          tebe. Tady experimentuješ sám se sebou — a skládáš si systém, který
          sedí tobě. Dílek po dílku.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <AccessButton loading={buying} onClick={handleBuy} />
          <button
            onClick={() => setShowMagic(true)}
            className="inline-flex items-center gap-1.5 px-6 py-4 rounded-full
              border border-foreground/15 font-semibold text-base text-foreground/70
              hover:border-foreground/30 hover:text-foreground transition-colors bg-white/60"
          >
            Přihlásit se
          </button>
        </div>
        {buyError && <p className="mt-3 text-sm text-red-500">{buyError}</p>}
        <p className="mt-5 text-xs text-foreground/35">
          490 Kč / rok · Přístup ke všem nástrojům · Zrušit lze kdykoliv
        </p>
      </section>

      {/* Nástroje — interaktivní ukázky */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <h2 className="text-xl font-bold mb-6">Co v Laboratoři najdeš</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KompasPreview />
          <HodnotyPreview />
          <DenPreview />
        </div>
        <p className="text-xs text-foreground/35 mt-5 text-center">
          Další nástroje průběžně přibývají — všechny v ceně předplatného.
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
      <section className="max-w-2xl mx-auto px-5 pb-24">
        <h2 className="text-xl font-bold mb-6">Časté otázky</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function LaboratorSalesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFDF7]" />
      }
    >
      <LaboratorContent />
    </Suspense>
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

// ── Interactive tool previews ─────────────────────────────────────────────────

function KompasPreview() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="paper-card rounded-[20px] px-5 py-5 flex flex-col gap-3">
      <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">🧭 Kompas</span>
      <p className="text-sm text-foreground/80 leading-relaxed italic">
        &ldquo;Kdy naposledy jsi udělal/a něco, co ti dávalo smysl — ne proto, že jsi musel/a?&rdquo;
      </p>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="self-start text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          Co s tím Kompas dělá? →
        </button>
      ) : (
        <p className="text-xs text-foreground/55 leading-relaxed">
          Tohle je jedna z otázek, kterými Kompas začíná. Sedm kroků od &bdquo;kde jsem&ldquo; po &bdquo;kam chci jít.&ldquo;
        </p>
      )}
    </div>
  );
}

const SAMPLE_VALUES = ["Svoboda", "Bezpečí", "Zvídavost", "Uznání"];

function HodnotyPreview() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="paper-card rounded-[20px] px-5 py-5 flex flex-col gap-3">
      <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">⭐ Hodnoty</span>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_VALUES.map((v) => (
          <button
            key={v}
            onClick={() => setSelected(selected === v ? null : v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selected === v
                ? "bg-accent text-white border-accent shadow-md scale-105"
                : "bg-white/80 text-foreground/70 border-foreground/12 hover:border-accent/40 hover:text-accent"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {selected ? (
        <p className="text-xs text-foreground/55 leading-relaxed">
          <span className="font-semibold text-foreground/70">{selected}</span> — proč zrovna ta? Projdeš všech 56 a najdeš ty svoje.
        </p>
      ) : (
        <p className="text-xs text-foreground/40">Klikni a zamysli se — proč zrovna ta?</p>
      )}
    </div>
  );
}

const MORNING_OPTIONS = [
  "Scrolluju telefon",
  "Nemám rutinu",
  "Rutinu nedodržím",
];

function DenPreview() {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="paper-card rounded-[20px] px-5 py-5 flex flex-col gap-3">
      <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">⏱️ Tvůj den</span>
      <p className="text-xs text-foreground/55 mb-0.5">Jak vypadá tvoje ráno?</p>
      <div className="flex flex-col gap-1.5">
        {MORNING_OPTIONS.map((opt, i) => (
          <button
            key={i}
            onClick={() => setPicked(picked === i ? null : i)}
            className={`text-left px-3 py-2 rounded-xl text-xs border transition-all ${
              picked === i
                ? "bg-accent/10 border-accent/30 text-foreground font-semibold"
                : "bg-white/80 border-foreground/8 text-foreground/65 hover:border-accent/25"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p className="text-xs text-foreground/55 leading-relaxed">
          Sestav si ráno, den i večer z rituálů, které dávají smysl tvému mozku.
        </p>
      )}
    </div>
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
