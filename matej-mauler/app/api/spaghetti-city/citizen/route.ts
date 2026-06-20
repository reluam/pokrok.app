import { NextRequest, NextResponse } from "next/server";
import { formatEther, parseEther } from "viem";
import { readSession } from "@/lib/spaghetti-city/session";
import { ADDRESSES, areContractsConfigured, cityChain } from "@/lib/cityChain";
import { citizenAbi, pastaAbi, publicClient, relayer } from "@/lib/spaghetti-city/contracts";
import { getCitizen, logTx, recordCitizen } from "@/lib/cityDb";

export const dynamic = "force-dynamic";

const STARTER_RAGU = parseEther("1000"); // sponsored welcome airdrop

function sessionAddress(req: NextRequest): `0x${string}` | null {
  const a = readSession(req.cookies.get("sc_session")?.value);
  return a ? (a as `0x${string}`) : null;
}

function sanitizeHandle(input: unknown, address: string): string {
  const raw = typeof input === "string" ? input : "";
  const cleaned = raw.trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 24).trim();
  return cleaned || `Citizen-${address.slice(2, 6)}`;
}

/** Citizenship status for the signed-in wallet. */
export async function GET(req: NextRequest) {
  const address = sessionAddress(req);
  if (!address) return NextResponse.json({ address: null, citizen: false });

  let citizen = false;
  let tokenId: number | null = null;
  let balance: string | null = null;

  if (areContractsConfigured()) {
    try {
      const pc = publicClient();
      const id = (await pc.readContract({
        address: ADDRESSES.citizenId!,
        abi: citizenAbi,
        functionName: "idOf",
        args: [address],
      })) as bigint;
      citizen = id > BigInt(0);
      tokenId = citizen ? Number(id) : null;
      if (citizen) {
        const bal = (await pc.readContract({
          address: ADDRESSES.pastaToken!,
          abi: pastaAbi,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;
        balance = formatEther(bal);
      }
    } catch {
      /* fall back to cache below */
    }
  }

  const cached = await getCitizen(address).catch(() => null);
  return NextResponse.json({
    address,
    citizen: citizen || !!cached,
    tokenId: tokenId ?? cached?.token_id ?? null,
    handle: cached?.handle ?? null,
    balance,
  });
}

/** Sponsored onboarding: relayer mints the soulbound CitizenID and airdrops $RAGU. */
export async function POST(req: NextRequest) {
  const address = sessionAddress(req);
  if (!address) return NextResponse.json({ ok: false, error: "not signed in" }, { status: 401 });

  const r = relayer();
  if (!areContractsConfigured() || !r) {
    return NextResponse.json({ ok: false, error: "on-chain not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const handle = sanitizeHandle(body?.handle, address);
  const pc = publicClient();

  try {
    // Already a citizen? (enforced on-chain too, but avoid a wasted tx)
    const existing = (await pc.readContract({
      address: ADDRESSES.citizenId!,
      abi: citizenAbi,
      functionName: "idOf",
      args: [address],
    })) as bigint;
    if (existing > BigInt(0)) {
      return NextResponse.json({ ok: true, already: true, tokenId: Number(existing) });
    }

    // 1) Mint soulbound citizenship (gas paid by relayer).
    const mintTx = await r.wallet.writeContract({
      address: ADDRESSES.citizenId!,
      abi: citizenAbi,
      functionName: "mint",
      args: [address, handle],
      account: r.account,
      chain: cityChain,
    });
    await pc.waitForTransactionReceipt({ hash: mintTx });

    const id = (await pc.readContract({
      address: ADDRESSES.citizenId!,
      abi: citizenAbi,
      functionName: "idOf",
      args: [address],
    })) as bigint;

    // 2) Airdrop starter $RAGU.
    const airdropTx = await r.wallet.writeContract({
      address: ADDRESSES.pastaToken!,
      abi: pastaAbi,
      functionName: "mint",
      args: [address, STARTER_RAGU],
      account: r.account,
      chain: cityChain,
    });
    await pc.waitForTransactionReceipt({ hash: airdropTx });

    await recordCitizen({ address, tokenId: id, handle, txHash: mintTx });
    await logTx({ txHash: mintTx, address, kind: "citizen.mint", payload: { handle, tokenId: Number(id) } });
    await logTx({ txHash: airdropTx, address, kind: "airdrop", payload: { amount: "1000" } });

    return NextResponse.json({ ok: true, tokenId: Number(id), handle, mintTx, airdropTx });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "onboarding failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
