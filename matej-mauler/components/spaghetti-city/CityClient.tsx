"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { createSiweMessage } from "viem/siwe";
import type { Lang } from "@/lib/dictionaries";
import { isChainConfigured, explorerTxUrl } from "@/lib/cityChain";
import { Web3Providers } from "@/app/spaghetti-city/web3/Providers";
import { CityBoard } from "./CityBoard";

const COPY = {
  cs: {
    config: "On-chain část se právě nastavuje. Brzy si tu připojíš peněženku a staneš se občanem.",
    connectTitle: "Staň se občanem",
    connectLede: "Připoj si peněženku — bude to tvůj klíč k identitě a majetku ve městě.",
    signIn: "Přihlásit se podpisem",
    signing: "Podepisuji…",
    signError: "Přihlášení se nepovedlo. Zkus to prosím znovu.",
    handleLabel: "Jak ti budou ve městě říkat?",
    handlePlaceholder: "tvoje jméno občana",
    claim: "Získat občanství zdarma",
    minting: "Razím občanství on-chain…",
    claimNote: "Vyrazíme ti nepřenosné ID a pošleme 1000 $RAGU na start. Gas platíme my.",
    citizenTitle: "Jsi občan Spaghetti Města",
    unit: "Občan č.",
    balance: "Zůstatek",
    view: "Zobrazit transakci",
    onboardError: "Ražba se nepovedla. Zkus to prosím znovu.",
  },
  en: {
    config: "The on-chain part is being configured. Soon you'll connect a wallet and become a citizen.",
    connectTitle: "Become a citizen",
    connectLede: "Connect a wallet — it will be your key to identity and property in the city.",
    signIn: "Sign in with your wallet",
    signing: "Signing…",
    signError: "Sign-in failed. Please try again.",
    handleLabel: "What should the city call you?",
    handlePlaceholder: "your citizen name",
    claim: "Claim citizenship for free",
    minting: "Minting your citizenship on-chain…",
    claimNote: "We mint you a non-transferable ID and send 1000 $RAGU to start. We pay the gas.",
    citizenTitle: "You are a citizen of Spaghetti City",
    unit: "Citizen No.",
    balance: "Balance",
    view: "View transaction",
    onboardError: "Minting failed. Please try again.",
  },
} as const;

type Citizen = { citizen: boolean; tokenId: number | null; handle: string | null; balance: string | null };

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-neutral-900/85 bg-[#FDFBF7] p-5">{children}</div>;
}

function CityInner({ lang }: { lang: Lang }) {
  const t = COPY[lang] ?? COPY.en;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [verified, setVerified] = useState(false);
  const [signStatus, setSignStatus] = useState<"idle" | "signing" | "error">("idle");
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [handle, setHandle] = useState("");
  const [onboard, setOnboard] = useState<"idle" | "minting" | "error">("idle");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const refreshCitizen = useCallback(async () => {
    try {
      const res = await fetch("/api/spaghetti-city/citizen");
      const data = await res.json();
      if (data.address) setVerified(true);
      setCitizen({ citizen: !!data.citizen, tokenId: data.tokenId, handle: data.handle, balance: data.balance });
    } catch {
      /* ignore */
    }
  }, []);

  // Returning visitors may already have a session cookie — skip the sign-in step.
  useEffect(() => {
    let alive = true;
    fetch("/api/spaghetti-city/citizen")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.address) setVerified(true);
        setCitizen({ citizen: !!data.citizen, tokenId: data.tokenId, handle: data.handle, balance: data.balance });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!address) return;
    setSignStatus("signing");
    try {
      const nonce = (await (await fetch("/api/spaghetti-city/siwe")).json()).nonce as string;
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Spaghetti City.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/spaghetti-city/siwe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "failed");
      setVerified(true);
      setSignStatus("idle");
      refreshCitizen();
    } catch {
      setSignStatus("error");
    }
  }, [address, chainId, signMessageAsync, refreshCitizen]);

  const claimCitizenship = useCallback(async () => {
    setOnboard("minting");
    try {
      const res = await fetch("/api/spaghetti-city/citizen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "failed");
      if (data.mintTx) setLastTx(data.mintTx);
      setOnboard("idle");
      await refreshCitizen();
    } catch {
      setOnboard("error");
    }
  }, [handle, refreshCitizen]);

  // Already a citizen → citizen header + the city board.
  if (citizen?.citizen) {
    return (
      <div>
        <Card>
          <h3 className="text-lg font-semibold">{t.citizenTitle}</h3>
          <p className="mt-2 text-sm text-neutral-700">
            {t.unit} <strong>{String(citizen.tokenId ?? 0).padStart(4, "0")}</strong>
            {citizen.handle ? <> · {citizen.handle}</> : null}
          </p>
          {lastTx && (
            <a className="mt-3 inline-block text-xs underline" href={explorerTxUrl(lastTx)} target="_blank" rel="noreferrer">
              {t.view} ↗
            </a>
          )}
        </Card>
        <CityBoard lang={lang} />
      </div>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold">{t.connectTitle}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{t.connectLede}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ConnectButton showBalance={false} chainStatus="icon" />
        {isConnected && !verified && (
          <button
            onClick={signIn}
            disabled={signStatus === "signing"}
            className="rounded-full border-2 border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {signStatus === "signing" ? t.signing : t.signIn}
          </button>
        )}
      </div>
      {signStatus === "error" && <p className="mt-3 text-sm text-red-700">{t.signError}</p>}

      {verified && (
        <div className="mt-5 border-t border-neutral-900/10 pt-5">
          <label className="block text-sm font-medium">{t.handleLabel}</label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t.handlePlaceholder}
            maxLength={24}
            className="mt-2 w-full max-w-xs rounded-lg border-2 border-neutral-900/85 bg-white px-3 py-2 text-sm outline-none"
          />
          <div className="mt-3">
            <button
              onClick={claimCitizenship}
              disabled={onboard === "minting"}
              className="rounded-full border-2 border-neutral-900 bg-amber-300 px-4 py-2 text-sm font-semibold text-neutral-900 transition disabled:opacity-50"
            >
              {onboard === "minting" ? t.minting : t.claim}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">{t.claimNote}</p>
          {onboard === "error" && <p className="mt-2 text-sm text-red-700">{t.onboardError}</p>}
        </div>
      )}
    </Card>
  );
}

export function CityClient({ lang }: { lang: Lang }) {
  const t = COPY[lang] ?? COPY.en;
  if (!isChainConfigured()) {
    return (
      <Card>
        <p className="text-sm text-neutral-500">{t.config}</p>
      </Card>
    );
  }
  return (
    <Web3Providers>
      <CityInner lang={lang} />
    </Web3Providers>
  );
}
