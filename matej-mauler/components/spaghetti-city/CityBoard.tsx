"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { formatEther, maxUint256, parseEther } from "viem";
import type { Lang } from "@/lib/dictionaries";
import { ADDRESSES, explorerTxUrl } from "@/lib/cityChain";
import { cityAbi, pastaAbi, CITY_GRID, CITY_PARCELS } from "@/lib/spaghetti-city/abis";

const COPY = {
  cs: {
    citizens: "občanů",
    balance: "Tvůj zůstatek",
    selectHint: "Klikni na parcelu na mapě.",
    empty: "Volná parcela",
    mine: "Tvoje parcela",
    other: "Cizí parcela",
    owner: "Vlastník",
    building: "Budova",
    none: "žádná",
    farm: "Špagetová farma",
    level: "úroveň",
    pending: "K vyzvednutí",
    claim: "Zabrat parcelu",
    build: "Postavit farmu",
    upgrade: "Vylepšit na úroveň",
    harvest: "Vyzvednout výnos",
    listLabel: "Prodat za (RAGU)",
    list: "Dát do prodeje",
    unlist: "Stáhnout z prodeje",
    forSale: "V prodeji za",
    buy: "Koupit za",
    working: "Posílám na blockchain…",
    onchainTitle: "Zapsáno na blockchain",
    onchainBody: "Tahle akce je teď navždy a veřejně zapsaná. Nikdo ji nepřepíše.",
    view: "Zobrazit transakci ↗",
    close: "Zavřít",
  },
  en: {
    citizens: "citizens",
    balance: "Your balance",
    selectHint: "Click a parcel on the map.",
    empty: "Empty parcel",
    mine: "Your parcel",
    other: "Someone else's parcel",
    owner: "Owner",
    building: "Building",
    none: "none",
    farm: "Pasta Farm",
    level: "level",
    pending: "Ready to harvest",
    claim: "Claim parcel",
    build: "Build a farm",
    upgrade: "Upgrade to level",
    harvest: "Harvest yield",
    listLabel: "Sell for (RAGU)",
    list: "List for sale",
    unlist: "Remove from sale",
    forSale: "For sale at",
    buy: "Buy for",
    working: "Sending to the blockchain…",
    onchainTitle: "Written to the blockchain",
    onchainBody: "This action is now permanent and public. No one can overwrite it.",
    view: "View transaction ↗",
    close: "Close",
  },
} as const;

type Parcel = { id: number; owner: string; building: number; level: number; lastHarvest: number; salePrice: string };
type Board = {
  ok: boolean;
  economy: { claimCost: string; yieldRatePerSec: string; buildCost: string };
  citizens: number;
  parcels: Parcel[];
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function CityBoard({ lang }: { lang: Lang }) {
  const t = COPY[lang] ?? COPY.en;
  const { address } = useAccount();
  const pc = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [board, setBoard] = useState<Board | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ hash: string; label: string } | null>(null);
  const [price, setPrice] = useState("");
  const [now, setNow] = useState(0); // ticking clock for live "pending yield" (set client-side)

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const city = ADDRESSES.city!;
  const pasta = ADDRESSES.pastaToken!;

  const loadBoard = useCallback(async () => {
    try {
      const r = await fetch("/api/spaghetti-city/state");
      setBoard(await r.json());
    } catch {
      /* ignore */
    }
  }, []);

  const loadBalance = useCallback(async () => {
    if (!pc || !address) return;
    try {
      const b = (await pc.readContract({
        address: pasta,
        abi: pastaAbi,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      setBalance(formatEther(b));
    } catch {
      /* ignore */
    }
  }, [pc, address, pasta]);

  useEffect(() => {
    let alive = true;
    fetch("/api/spaghetti-city/state")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setBoard(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!pc || !address) return;
    let alive = true;
    pc.readContract({ address: pasta, abi: pastaAbi, functionName: "balanceOf", args: [address] })
      .then((b) => {
        if (alive) setBalance(formatEther(b as bigint));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pc, address, pasta]);

  const byId = useMemo(() => {
    const m = new Map<number, Parcel>();
    board?.parcels?.forEach((p) => m.set(p.id, p));
    return m;
  }, [board]);

  const ensureAllowance = useCallback(
    async (needed: bigint) => {
      if (!pc || !address) return;
      const current = (await pc.readContract({
        address: pasta,
        abi: pastaAbi,
        functionName: "allowance",
        args: [address, city],
      })) as bigint;
      if (current >= needed) return;
      const hash = await writeContractAsync({
        address: pasta,
        abi: pastaAbi,
        functionName: "approve",
        args: [city, maxUint256],
      });
      await pc.waitForTransactionReceipt({ hash });
    },
    [pc, address, pasta, city, writeContractAsync]
  );

  const run = useCallback(
    async (key: string, label: string, fn: () => Promise<`0x${string}`>) => {
      setBusy(key);
      try {
        const hash = await fn();
        if (pc) await pc.waitForTransactionReceipt({ hash });
        setToast({ hash, label });
        await loadBoard();
        await loadBalance();
      } catch {
        /* user rejected or revert — leave UI as-is */
      } finally {
        setBusy(null);
      }
    },
    [pc, loadBoard, loadBalance]
  );

  if (board && board.ok === false) {
    return null; // onboarding card handles the "not configured" case
  }

  const econ = board?.economy;
  const selParcel = sel != null ? byId.get(sel) ?? null : null;
  const selMine = !!(selParcel && address && selParcel.owner === address.toLowerCase());
  const selForSale = !!(selParcel && selParcel.salePrice !== "0");

  const estPending = (p: Parcel): number => {
    if (!econ || p.building === 0 || now === 0) return 0;
    return Number(econ.yieldRatePerSec) * p.level * Math.max(0, now - p.lastHarvest);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-neutral-600">
        <span>
          {board?.citizens ?? 0} {t.citizens}
        </span>
        {balance != null && (
          <span>
            {t.balance}: <strong>{Number(balance).toLocaleString()} $RAGU</strong>
          </span>
        )}
      </div>

      {/* Map */}
      <div
        className="mt-3 grid gap-[3px] rounded-2xl border-2 border-neutral-900/85 bg-[#FDFBF7] p-2"
        style={{ gridTemplateColumns: `repeat(${CITY_GRID}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: CITY_PARCELS }).map((_, id) => {
          const p = byId.get(id);
          const mine = !!(p && address && p.owner === address.toLowerCase());
          const forSale = !!(p && p.salePrice !== "0");
          const selected = sel === id;
          let cls = "bg-[#F0EADF] hover:bg-[#E6DECF]"; // empty
          if (p && mine) cls = "bg-amber-300 hover:bg-amber-400";
          else if (p) cls = "bg-neutral-300 hover:bg-neutral-400";
          return (
            <button
              key={id}
              onClick={() => setSel(id)}
              title={`#${id}`}
              className={`relative aspect-square rounded-[3px] text-[9px] font-semibold text-neutral-800 transition ${cls} ${
                selected ? "ring-2 ring-neutral-900" : ""
              } ${forSale ? "outline outline-2 outline-emerald-600" : ""}`}
            >
              {p && p.building > 0 ? p.level : ""}
            </button>
          );
        })}
      </div>

      {/* Selected parcel panel */}
      <div className="mt-4 rounded-2xl border-2 border-neutral-900/85 bg-[#FDFBF7] p-4">
        {selParcel == null && sel == null && <p className="text-sm text-neutral-500">{t.selectHint}</p>}

        {sel != null && (
          <>
            <div className="flex items-baseline justify-between">
              <h4 className="font-semibold">
                {selParcel == null ? t.empty : selMine ? t.mine : t.other} · #{sel}
              </h4>
              {selParcel && (
                <span className="text-xs text-neutral-500">
                  {t.owner}: {short(selParcel.owner)}
                </span>
              )}
            </div>

            {selParcel && (
              <p className="mt-1 text-sm text-neutral-600">
                {t.building}: {selParcel.building === 0 ? t.none : `${t.farm} (${t.level} ${selParcel.level})`}
                {selParcel.building > 0 && (
                  <>
                    {" · "}
                    {t.pending}: <strong>{estPending(selParcel).toFixed(3)} $RAGU</strong>
                  </>
                )}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {/* Empty → claim */}
              {selParcel == null && (
                <button
                  onClick={() => run(`claim-${sel}`, t.claim, async () => {
                    await ensureAllowance(parseEther(board!.economy.claimCost));
                    return writeContractAsync({ address: city, abi: cityAbi, functionName: "claim", args: [BigInt(sel)] });
                  })}
                  disabled={!!busy}
                  className="rounded-full border-2 border-neutral-900 bg-amber-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                >
                  {busy === `claim-${sel}` ? t.working : `${t.claim} (${econ?.claimCost ?? "?"} RAGU)`}
                </button>
              )}

              {/* Mine → build/upgrade + harvest + list/unlist */}
              {selMine && selParcel && (
                <>
                  {selParcel.level < 5 && (
                    <button
                      onClick={() => run(`build-${sel}`, selParcel.building === 0 ? t.build : t.upgrade, async () => {
                        await ensureAllowance(parseEther(board!.economy.buildCost));
                        return writeContractAsync({ address: city, abi: cityAbi, functionName: "build", args: [BigInt(sel), 1] });
                      })}
                      disabled={!!busy}
                      className="rounded-full border-2 border-neutral-900 bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {busy === `build-${sel}`
                        ? t.working
                        : selParcel.building === 0
                          ? `${t.build} (${econ?.buildCost ?? "?"} RAGU)`
                          : `${t.upgrade} ${selParcel.level + 1} (${econ?.buildCost ?? "?"} RAGU)`}
                    </button>
                  )}
                  {selParcel.building > 0 && (
                    <button
                      onClick={() => run(`harvest-${sel}`, t.harvest, async () =>
                        writeContractAsync({ address: city, abi: cityAbi, functionName: "harvest", args: [BigInt(sel)] })
                      )}
                      disabled={!!busy}
                      className="rounded-full border-2 border-neutral-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      {busy === `harvest-${sel}` ? t.working : t.harvest}
                    </button>
                  )}
                  {selForSale ? (
                    <button
                      onClick={() => run(`unlist-${sel}`, t.unlist, async () =>
                        writeContractAsync({ address: city, abi: cityAbi, functionName: "list", args: [BigInt(sel), BigInt(0)] })
                      )}
                      disabled={!!busy}
                      className="rounded-full border-2 border-neutral-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      {busy === `unlist-${sel}` ? t.working : t.unlist}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={t.listLabel}
                        inputMode="decimal"
                        className="w-28 rounded-lg border-2 border-neutral-900/85 bg-white px-2 py-1.5 text-sm outline-none"
                      />
                      <button
                        onClick={() => run(`list-${sel}`, t.list, async () =>
                          writeContractAsync({ address: city, abi: cityAbi, functionName: "list", args: [BigInt(sel), parseEther(price || "0")] })
                        )}
                        disabled={!!busy || !price}
                        className="rounded-full border-2 border-neutral-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                      >
                        {busy === `list-${sel}` ? t.working : t.list}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Someone else's, for sale → buy */}
              {!selMine && selParcel && selForSale && (
                <button
                  onClick={() => run(`buy-${sel}`, t.buy, async () => {
                    await ensureAllowance(parseEther(selParcel.salePrice));
                    return writeContractAsync({ address: city, abi: cityAbi, functionName: "buy", args: [BigInt(sel)] });
                  })}
                  disabled={!!busy}
                  className="rounded-full border-2 border-neutral-900 bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy === `buy-${sel}` ? t.working : `${t.buy} ${selParcel.salePrice} RAGU`}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* "What just happened on-chain" overlay */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border-2 border-neutral-900 bg-[#FDFBF7] p-4 shadow-lg">
          <p className="text-sm font-semibold">⛓️ {toast.label} — {t.onchainTitle}</p>
          <p className="mt-1 text-xs text-neutral-600">{t.onchainBody}</p>
          <div className="mt-2 flex items-center justify-between">
            <a className="text-xs underline" href={explorerTxUrl(toast.hash)} target="_blank" rel="noreferrer">
              {t.view}
            </a>
            <button className="text-xs text-neutral-500" onClick={() => setToast(null)}>
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
