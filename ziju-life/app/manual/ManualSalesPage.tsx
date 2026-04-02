"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

const CODE_LENGTH = 6;

const faqs = [
  {
    q: "Co je Manuál?",
    a: "Interaktivní cvičení (Kompas, Hodnoty, Rituály), doprovodná aplikace pro každodenní život (dashboard, to-do, check-iny) a AI průvodce, který tě zná a pomáhá ti vidět věci z nových perspektiv.",
  },
  {
    q: "Pro koho to je?",
    a: "Pro tebe, pokud chceš žít vědoměji. Ať už hledáš směr, chceš si pojmenovat hodnoty, nebo potřebuješ parťáka na přemýšlení — Manuál je místo, kde experimentuješ sám se sebou.",
  },
  {
    q: "Co dostanu?",
    a: "Přístup ke všem cvičením, aplikaci a AI průvodci — teď i do budoucna. Nové funkce automaticky v ceně. Za 490 Kč ročně, což je méně než 1 káva měsíčně.",
  },
  {
    q: "Můžu předplatné zrušit?",
    a: "Ano, kdykoliv. Přes Stripe zákaznický portál jedním klikem. Žádné podmínky, žádné výpovědní lhůty.",
  },
];

// ── Magic link modal ──────────────────────────────────────────────────────────

type MagicState = "idle" | "loading" | "sent" | "error";

function MagicLinkModal({ onClose }: { onClose: () => void }) {
  useScrollLock(true);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<MagicState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: "/manual/dashboard" }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("sent");
        setTimeout(() => codeRefs.current[0]?.focus(), 100);
      } else {
        setErrorMsg(data.error || "Nepodařilo se odeslat e-mail.");
        setState("error");
      }
    } catch {
      setErrorMsg("Chyba připojení. Zkus to znovu.");
      setState("error");
    }
  }

  function handleDigitChange(i: number, val: string) {
    const d = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setCodeError("");
    if (d && i < CODE_LENGTH - 1) codeRefs.current[i + 1]?.focus();
    const full = next.join("");
    if (full.length === CODE_LENGTH) verifyCode(full);
  }

  function handleKeyDown(i: number, key: string) {
    if (key === "Backspace" && !digits[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const t = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (t.length === CODE_LENGTH) {
      setDigits(t.split(""));
      codeRefs.current[CODE_LENGTH - 1]?.focus();
      verifyCode(t);
    }
  }

  async function verifyCode(code: string) {
    if (verifying) return;
    setVerifying(true);
    setCodeError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, source: "web" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || "Neplatný kód.");
        setDigits(Array(CODE_LENGTH).fill(""));
        codeRefs.current[0]?.focus();
        setVerifying(false);
        return;
      }
      window.location.href = "/manual/dashboard";
    } catch {
      setCodeError("Chyba. Zkus to znovu.");
      setVerifying(false);
    }
  }

  async function handleResend() {
    setState("loading");
    try {
      await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: "/manual/dashboard" }),
      });
      setDigits(Array(CODE_LENGTH).fill(""));
      setState("sent");
      codeRefs.current[0]?.focus();
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      data-lenis-prevent
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto paper-card rounded-[28px] px-7 py-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-foreground/30 hover:text-foreground/60 text-xl leading-none"
          aria-label="Zavřít"
        >
          ×
        </button>

        {state === "sent" ? (
          <div className="text-center py-2">
            <div className="text-4xl mb-3">📬</div>
            <p className="font-extrabold text-lg mb-2">Zkontroluj e-mail</p>
            <p className="text-sm text-foreground/55 leading-relaxed mb-5">
              Poslali jsme kód a odkaz na <strong>{email}</strong>.
            </p>

            <p className="text-xs font-semibold text-foreground mb-3">Zadej 6místný kód:</p>
            <div className="flex justify-center gap-1.5 mb-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(r) => { codeRefs.current[i] = r; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => {
                    if (e.target.value.length > 1) { handlePaste({ clipboardData: { getData: () => e.target.value } } as unknown as React.ClipboardEvent); }
                    else handleDigitChange(i, e.target.value);
                  }}
                  onKeyDown={(e) => handleKeyDown(i, e.key)}
                  onPaste={handlePaste}
                  disabled={verifying}
                  className={`w-10 h-12 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors ${
                    d ? "border-accent bg-accent/5" : "border-foreground/10 bg-white"
                  } focus:border-accent`}
                />
              ))}
            </div>

            {verifying && <p className="text-xs text-accent mb-2">Ověřuji...</p>}
            {codeError && <p className="text-xs text-red-500 mb-2">{codeError}</p>}

            <p className="text-xs text-foreground/40 mb-4">
              Kód je platný 5 minut. Nebo klikni na odkaz v e-mailu.
            </p>

            <div className="flex items-center justify-center gap-3 text-xs text-foreground/40">
              <button
                onClick={handleResend}
                className="underline hover:text-foreground/70 transition-colors"
              >
                Odeslat znovu
              </button>
              <span>·</span>
              <button
                onClick={onClose}
                className="underline hover:text-foreground/70 transition-colors"
              >
                Zavřít
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-extrabold text-lg mb-1">Přihlásit se</p>
            <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
              Zadej e-mail svého účtu — pošleme ti kód pro přihlášení.
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
                  "Poslat kód →"
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

function ManualContent() {
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
      const res = await fetch("/api/manual/checkout", { method: "POST" });
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
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-16">
        <div className="bg-[#fdf0e6]/50 border border-black/8 rounded-[32px] px-8 md:px-16 py-14 md:py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
            Manuál
          </h1>
          <p className="text-lg text-foreground/65 leading-relaxed mb-10 max-w-xl mx-auto">
            Interaktivní cvičení, doprovodná aplikace pro každodenní život a AI průvodce
            pro více vědomý život. Experimentuj sám se sebou — a poskládej si život podle sebe.
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
        </div>
      </section>

      {/* Tři pilíře */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground text-center mb-10">
          Co v Manuálu najdeš
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Interaktivní cvičení */}
          <div className="bg-white border border-black/8 rounded-[24px] px-6 py-8 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
                <circle cx="60" cy="60" r="50" stroke="#d4a574" strokeWidth="4" fill="#faf3eb" />
                <circle cx="60" cy="60" r="42" stroke="#c49660" strokeWidth="2" fill="none" />
                <text x="60" y="22" textAnchor="middle" fill="#8b6b47" fontSize="10" fontWeight="bold">S</text>
                <text x="60" y="106" textAnchor="middle" fill="#8b6b47" fontSize="10" fontWeight="bold">J</text>
                <text x="16" y="64" textAnchor="middle" fill="#8b6b47" fontSize="10" fontWeight="bold">Z</text>
                <text x="104" y="64" textAnchor="middle" fill="#8b6b47" fontSize="10" fontWeight="bold">V</text>
                <line x1="60" y1="28" x2="60" y2="92" stroke="#c49660" strokeWidth="1" opacity="0.3" />
                <line x1="28" y1="60" x2="92" y2="60" stroke="#c49660" strokeWidth="1" opacity="0.3" />
                <polygon points="60,30 56,50 64,50" fill="#4a90d9" />
                <polygon points="60,90 56,70 64,70" fill="#d94a4a" />
                <circle cx="60" cy="60" r="4" fill="#c49660" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">Interaktivní cvičení</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Kompas životních oblastí, pojmenování hodnot, nastavení denních rituálů. Projdeš ve svém tempu — na konci máš jasný výstup.
            </p>
          </div>

          {/* Aplikace pro každý den */}
          <div className="bg-white border border-black/8 rounded-[24px] px-6 py-8 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 100 140" fill="none" className="h-full">
                <rect x="15" y="5" width="70" height="130" rx="14" stroke="#c49660" strokeWidth="3" fill="#faf3eb" />
                <rect x="20" y="20" width="60" height="95" rx="4" fill="white" stroke="#e8dcc8" strokeWidth="1" />
                <circle cx="50" cy="125" r="5" stroke="#c49660" strokeWidth="2" fill="none" />
                <rect x="28" y="28" width="44" height="6" rx="3" fill="#FF8C42" opacity="0.3" />
                <rect x="28" y="40" width="30" height="4" rx="2" fill="#e8dcc8" />
                <rect x="28" y="50" width="38" height="4" rx="2" fill="#e8dcc8" />
                <rect x="28" y="60" width="25" height="4" rx="2" fill="#e8dcc8" />
                <circle cx="30" cy="76" r="3" fill="#FF8C42" opacity="0.4" />
                <rect x="38" y="74" width="28" height="4" rx="2" fill="#e8dcc8" />
                <circle cx="30" cy="88" r="3" fill="#4ECDC4" opacity="0.4" />
                <rect x="38" y="86" width="22" height="4" rx="2" fill="#e8dcc8" />
                <circle cx="30" cy="100" r="3" fill="#B0A7F5" opacity="0.4" />
                <rect x="38" y="98" width="32" height="4" rx="2" fill="#e8dcc8" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">Aplikace pro každý den</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Dashboard s denním to-do, prioritami, check-iny a reflexemi. Tvůj osobní přehled, který ti pomůže žít vědoměji — každý den.
            </p>
          </div>

          {/* AI průvodce */}
          <div className="bg-white border border-black/8 rounded-[24px] px-6 py-8 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
                <ellipse cx="60" cy="95" rx="30" ry="8" fill="#e8dcc8" opacity="0.5" />
                <rect x="35" y="45" width="50" height="45" rx="10" fill="#d4e4f7" stroke="#8bb0d4" strokeWidth="2" />
                <rect x="30" y="30" width="60" height="40" rx="14" fill="#e8f0fa" stroke="#8bb0d4" strokeWidth="2" />
                <circle cx="47" cy="48" r="5" fill="#4a90d9" />
                <circle cx="73" cy="48" r="5" fill="#4a90d9" />
                <circle cx="47" cy="47" r="2" fill="white" />
                <circle cx="73" cy="47" r="2" fill="white" />
                <path d="M52 58 Q60 64 68 58" stroke="#8bb0d4" strokeWidth="2" fill="none" strokeLinecap="round" />
                <rect x="22" y="55" width="12" height="8" rx="4" fill="#d4e4f7" stroke="#8bb0d4" strokeWidth="1.5" />
                <rect x="86" y="55" width="12" height="8" rx="4" fill="#d4e4f7" stroke="#8bb0d4" strokeWidth="1.5" />
                <circle cx="90" cy="30" r="8" fill="#FFD966" stroke="#e8b830" strokeWidth="1.5" />
                <path d="M90 24 L90 30 L94 30" stroke="#e8b830" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M84 18 L86 22 M96 18 L94 22 M90 14 L90 19" stroke="#e8b830" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">AI průvodce</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Osobní thinking parťák, který tě zná. Dokáže ukázat nové perspektivy, položit správnou otázku a pomoct ti najít vlastní odpovědi.
            </p>
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="bg-[#fdf0e6]/50 border border-black/8 rounded-[28px] px-8 md:px-12 py-10 flex flex-col md:flex-row md:items-center gap-8">
          {/* Levá strana — cena + CTA */}
          <div className="md:w-1/2 space-y-5">
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">
              Předplatné
            </p>
            <p className="text-4xl md:text-5xl font-extrabold text-foreground">
              490 Kč za rok
            </p>
            <AccessButton loading={buying} onClick={handleBuy} />
            {buyError && (
              <p className="text-sm text-red-500">{buyError}</p>
            )}
          </div>

          {/* Pravá strana — seznam */}
          <ul className="md:w-1/2 space-y-3 text-sm text-foreground/70">
            {[
              "Interaktivní cvičení (Kompas, Hodnoty, Rituály)",
              "Aplikace pro každodenní život (dashboard, to-do, check-iny)",
              "AI průvodce — osobní thinking parťák",
              "Nové funkce automaticky v ceně",
              "Zrušit lze kdykoliv přes Stripe",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full shrink-0 mt-1.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-5 pb-24">
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground text-center mb-8">Časté otázky</h2>
        <div className="divide-y divide-black/8">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function ManualSalesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFDF7]" />
      }
    >
      <ManualContent />
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


function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between text-left gap-4"
      >
        <span className="font-bold text-lg text-foreground">{q}</span>
        <svg
          className={`w-5 h-5 text-foreground/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-base text-foreground/60 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
