import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cityChain } from "@/lib/cityChain";

// ABIs live in a client-safe module; re-export so existing server imports keep working.
export { citizenAbi, pastaAbi, cityAbi } from "./abis";

/**
 * Read-only client. Uses CITY_RPC_URL if set, else the chain's default public RPC.
 * `batch.multicall` auto-aggregates many parallel reads into Multicall3 calls.
 */
export function publicClient() {
  return createPublicClient({
    chain: cityChain,
    transport: http(process.env.CITY_RPC_URL),
    batch: { multicall: true },
  });
}

/**
 * Relayer wallet (sponsored onboarding) built from RELAYER_PRIVATE_KEY.
 * Returns null if the key is not configured so routes can degrade gracefully.
 * This is a hot key: fund it minimally, rate-limit, and rotate via the
 * contracts' setMinter if compromised.
 */
export function relayer() {
  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk) return null;
  const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`);
  const wallet = createWalletClient({ account, chain: cityChain, transport: http(process.env.CITY_RPC_URL) });
  return { account, wallet };
}
