"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/dictionaries";

/**
 * Interaktivní rychlokurz „proč a jak na peněženku". Žádné wallet knihovny —
 * čistá edukace (informuj + eduokuj + bav). Krok o podpisu má reálné SHA‑256
 * demo: změň písmeno → úplně jiný otisk.
 */

type Step = { h: string; body: string };

const COPY = {
  cs: {
    toggleOpen: "Nový ve světě peněženek? Rychlokurz na 2 minuty ↓",
    toggleClose: "Schovat rychlokurz ↑",
    of: "z",
    prev: "Zpět",
    next: "Dál",
    done: "Jdu na to ↓",
    tryLabel: "Zkus to: napiš cokoliv",
    fingerprint: "Otisk (SHA‑256):",
    hashNote: "Změň jediné písmeno — a otisk je úplně jiný. Přesně tak blockchain pozná, že se nic nešťouralo: malá změna = jiný otisk = okamžitě vidět.",
    steps: [
      { h: "Peněženka není banka. Je to klíč.", body: "Žádný účet u někoho, žádné heslo k resetu. Tvoje adresa je jako číslo dveří (veřejné, můžeš ho rozdávat), privátní klíč je klíč od nich (nikomu ho neukazuj). Drží ho appka jako MetaMask — ty jen klikáš." },
      { h: "Podpis = důkaz „jsem to já\" bez hesla.", body: "Místo hesla podepíšeš zprávu svým klíčem. Každý si ověří, že podpis sedí k tvé adrese — ale tvůj klíč nikdy neopustí peněženku. Funguje to na otiscích:" },
      { h: "Gas = drobný poplatek za zápis navždy.", body: "Když něco zapíšeš (zabereš parcelu), tisíce počítačů to uloží a ověří — za to platíš síti pár drobných. Na Base jsou to zlomky centu. Tvoje občanství a startovní $RAGU platíme my, ať můžeš začít zadarmo." },
      { h: "Soulbound vs NFT — vlastní obojí.", body: "Tvoje občanství je soulbound: nepřenosné, neprodejné — protože jsi to ty. Parcely jsou NFT: vlastníš je a klidně prodáš. Blockchain zvládá identitu i majetek, a každý hned pozná, co je co." },
      { h: "$RAGU = měna s veřejnými pravidly.", body: "Vzniká (mint) a mizí (burn) podle pravidel zapsaných v kontraktu. Nikdo je nezmění potají — vidí je každý, navždy. Žádný tajný tisk peněz pod stolem." },
      { h: "Proč to celé?", body: "Vlastnictví, které ti nikdo nepřepíše. Identita, kterou ovládáš ty. Pravidla, co vidí všichni. Tady ti to nevykládáme přednáškou — zahraješ si to. Připoj peněženku a staň se občanem." },
    ] as Step[],
  },
  en: {
    toggleOpen: "New to wallets? A 2-minute crash course ↓",
    toggleClose: "Hide the crash course ↑",
    of: "of",
    prev: "Back",
    next: "Next",
    done: "Let's go ↓",
    tryLabel: "Try it: type anything",
    fingerprint: "Fingerprint (SHA‑256):",
    hashNote: "Change a single letter — the fingerprint is completely different. That's exactly how a blockchain spots tampering: a tiny change = a different fingerprint = instantly visible.",
    steps: [
      { h: "A wallet isn't a bank. It's a key.", body: "No account held by anyone, no password reset. Your address is like a door number (public, share away); your private key is the key to it (never show it). An app like MetaMask holds it — you just click." },
      { h: "A signature proves \"it's me\" without a password.", body: "Instead of a password you sign a message with your key. Anyone can verify the signature matches your address — but your key never leaves the wallet. It all runs on fingerprints:" },
      { h: "Gas = a tiny fee to write something forever.", body: "When you write something (claim a parcel), thousands of computers store and verify it — you pay the network a few cents for that. On Base it's a fraction of a cent. Your citizenship and starter $RAGU are on us, so you start free." },
      { h: "Soulbound vs NFT — own both.", body: "Your citizenship is soulbound: non-transferable, unsellable — because it's you. Parcels are NFTs: you own them and can sell them. Blockchain handles identity and property, and everyone can tell which is which." },
      { h: "$RAGU = a currency with public rules.", body: "It's minted and burned by rules written in the contract. No one changes them in secret — everyone sees them, forever. No money-printing under the table." },
      { h: "Why all this?", body: "Ownership no one can overwrite. An identity you control. Rules everyone can see. We don't explain it with a lecture here — you play it. Connect a wallet and become a citizen." },
    ] as Step[],
  },
} as const;

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function WalletGuide({ lang }: { lang: Lang }) {
  const t = COPY[lang] ?? COPY.en;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [text, setText] = useState("Spaghetti");
  const [digest, setDigest] = useState("");

  // Live fingerprint demo (real SHA-256, runs in the browser).
  useEffect(() => {
    let alive = true;
    sha256Hex(text)
      .then((h) => {
        if (alive) setDigest(h);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [text]);

  const steps = t.steps;
  const s = steps[step];
  const last = step === steps.length - 1;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-2xl border-2 border-dashed border-neutral-900/50 bg-[#FDFBF7] px-4 py-3 text-left text-sm font-medium text-neutral-700 transition hover:bg-[#F3EEE4]"
      >
        🧭 {t.toggleOpen}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-neutral-900/85 bg-[#FDFBF7] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
          {step + 1} {t.of} {steps.length}
        </span>
        <button onClick={() => setOpen(false)} className="text-xs text-neutral-500 hover:text-neutral-800">
          {t.toggleClose}
        </button>
      </div>

      <h3 className="mt-3 text-lg font-semibold">{s.h}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{s.body}</p>

      {/* Interactive SHA-256 fingerprint demo on the "signature" step. */}
      {step === 1 && (
        <div className="mt-4 rounded-xl border-2 border-neutral-900/15 bg-white p-3">
          <label className="block text-xs font-medium text-neutral-600">{t.tryLabel}</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5 w-full rounded-lg border-2 border-neutral-900/85 bg-white px-3 py-2 text-sm outline-none"
          />
          <p className="mt-2 text-xs text-neutral-500">{t.fingerprint}</p>
          <code className="mt-1 block break-all font-mono text-[11px] text-neutral-800">{digest}</code>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">{t.hashNote}</p>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => setStep((n) => Math.max(0, n - 1))}
          disabled={step === 0}
          className="rounded-full border-2 border-neutral-900 px-4 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          {t.prev}
        </button>
        {last ? (
          <button
            onClick={() => setOpen(false)}
            className="rounded-full border-2 border-neutral-900 bg-amber-300 px-4 py-1.5 text-sm font-semibold"
          >
            {t.done}
          </button>
        ) : (
          <button
            onClick={() => setStep((n) => Math.min(steps.length - 1, n + 1))}
            className="rounded-full border-2 border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white"
          >
            {t.next}
          </button>
        )}

        {/* progress dots */}
        <div className="ml-auto flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-neutral-900" : "bg-neutral-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
