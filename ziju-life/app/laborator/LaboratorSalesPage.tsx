"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

const CODE_LENGTH = 6;

const faqs = [
  {
    q: "Co je Laboratoř?",
    a: "Interaktivní cvičení (Kompas, Hodnoty, Rituály), doprovodná aplikace pro každodenní život (dashboard, to-do, check-iny) a AI průvodce, který tě zná a pomáhá ti vidět věci z nových perspektiv.",
  },
  {
    q: "Pro koho to je?",
    a: "Pro tebe, pokud chceš žít vědoměji. Ať už hledáš směr, chceš si pojmenovat hodnoty, nebo potřebuješ parťáka na přemýšlení — Laboratoř je místo, kde experimentuješ sám se sebou.",
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
        body: JSON.stringify({ email, next: "/laborator/dashboard" }),
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
      window.location.href = "/laborator/dashboard";
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
        body: JSON.stringify({ email, next: "/laborator/dashboard" }),
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
          Interaktivní cvičení, doprovodná aplikace pro každodenní život a AI průvodce
          pro více vědomý život. Experimentuj sám se sebou — a skládej si systém, který
          sedí tobě.
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

      {/* Tři pilíře */}
      <section className="max-w-5xl mx-auto px-5 pb-12">
        <h2 className="text-xl font-bold mb-6">Co v Laboratoři najdeš</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="paper-card rounded-[20px] px-5 py-5 flex flex-col gap-2">
            <span className="text-3xl">🧭</span>
            <h3 className="font-bold text-foreground">Interaktivní cvičení</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Kompas životních oblastí, pojmenování hodnot, nastavení denních rituálů. Projdeš ve svém tempu — na konci máš jasný výstup.
            </p>
          </div>
          <div className="paper-card rounded-[20px] px-5 py-5 flex flex-col gap-2">
            <span className="text-3xl">📱</span>
            <h3 className="font-bold text-foreground">Aplikace pro každý den</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Dashboard s denním to-do, prioritami, check-iny a reflexemi. Tvůj osobní přehled, který ti pomůže žít vědoměji — každý den.
            </p>
          </div>
          <div className="paper-card rounded-[20px] px-5 py-5 flex flex-col gap-2">
            <span className="text-3xl">🤖</span>
            <h3 className="font-bold text-foreground">AI průvodce</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Osobní thinking parťák, který tě zná. Dokáže ukázat nové perspektivy, položit správnou otázku a pomoct ti najít vlastní odpovědi.
            </p>
          </div>
        </div>
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
              "Interaktivní cvičení (Kompas, Hodnoty, Rituály)",
              "Aplikace pro každodenní život (dashboard, to-do, check-iny)",
              "AI průvodce — osobní thinking parťák",
              "Nové funkce automaticky v ceně",
              "Zrušit lze kdykoliv přes Stripe",
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
