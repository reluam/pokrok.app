"use client";

import type { Lang } from "@/lib/dictionaries";
import { CityGate } from "@/components/spaghetti-city/CityGate";
import { WalletGuide } from "@/components/spaghetti-city/WalletGuide";

const COPY = {
  cs: {
    kicker: "Ekonomická simulace na blockchainu",
    title: "Spaghetti Město",
    lede:
      "Město, které celé žije na blockchainu. Získej občanství, vlastni kus města a hraj ekonomiku, kde každý tah je opravdový záznam — neměnný, tvůj, ověřitelný.",
    whyTitle: "Proč to existuje",
    why:
      "Většina lidí o blockchainu slyšela, ale nikdy nepochopila, k čemu vlastně je. Tady to nevysvětlujeme přednáškou — necháme tě to zažít. Tvoje identita, tvůj majetek, tvoje transakce. Žádné řeči, jen tah za tahem.",
    pillars: [
      { h: "Občanství = identita", p: "Připojíš peněženku a dostaneš nepřenosné digitální ID (soulbound). Nelze ho koupit ani prodat — prokazuje, že ten občan jsi ty." },
      { h: "Vlastnictví = parcely", p: "Claimuješ parcely, stavíš na nich a sbíráš výnos v měně $RAGU. Vlastnictví je zapsané na chainu — nikdo ti ho nepřepíše." },
      { h: "Ekonomika = $RAGU", p: "Měna se mintuje, utrácí a pálí podle pravidel, která jsou veřejná a neměnná. Obchoduj parcely na trhu mezi občany." },
    ],
    note: "Web zůstává plně přístupný i bez peněženky — peněženka je jen klíč k tomu, abys ve městě něco vlastnil.",
  },
  en: {
    kicker: "An on-chain economic simulation",
    title: "Spaghetti City",
    lede:
      "A city that lives entirely on the blockchain. Claim citizenship, own a piece of the city, and play an economy where every move is a real record — immutable, yours, verifiable.",
    whyTitle: "Why this exists",
    why:
      "Most people have heard of blockchain but never understood what it is actually for. We don't explain it with a lecture — we let you live it. Your identity, your property, your transactions. No talk, just move by move.",
    pillars: [
      { h: "Citizenship = identity", p: "Connect a wallet and receive a non-transferable digital ID (soulbound). It can't be bought or sold — it proves that this citizen is you." },
      { h: "Ownership = parcels", p: "Claim parcels, build on them, and collect yield in $RAGU. Ownership is written on-chain — no one can overwrite it." },
      { h: "Economy = $RAGU", p: "The currency is minted, spent and burned by rules that are public and immutable. Trade parcels on a market between citizens." },
    ],
    note: "The rest of the site stays fully usable without a wallet — the wallet is only the key to owning something in the city.",
  },
} as const;

export function SpaghettiCity({ lang }: { lang: Lang }) {
  const t = COPY[lang] ?? COPY.en;

  return (
    <main className="min-h-dvh bg-[#F7F3EC] text-neutral-900">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">{t.kicker}</p>
        <h1
          className="mt-3 text-5xl sm:text-6xl font-bold leading-[0.95]"
          style={{ fontFamily: "var(--font-display, var(--font-grotesk))" }}
        >
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700">{t.lede}</p>

        {/* On-chain onboarding (wallet → soulbound citizenship). */}
        <div className="mt-10">
          <CityGate lang={lang} />
        </div>

        {/* Interactive crash course: why & how to use a wallet (no wallet libs needed). */}
        <WalletGuide lang={lang} />

        <section className="mt-16">
          <h2 className="text-xs uppercase tracking-[0.24em] text-neutral-500">{t.whyTitle}</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-neutral-700">{t.why}</p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {t.pillars.map((p) => (
            <div key={p.h} className="rounded-2xl border-2 border-neutral-900/85 bg-[#FDFBF7] p-4">
              <h3 className="font-semibold">{p.h}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{p.p}</p>
            </div>
          ))}
        </section>

        <p className="mt-12 max-w-2xl text-sm leading-relaxed text-neutral-500">{t.note}</p>
      </div>
    </main>
  );
}
