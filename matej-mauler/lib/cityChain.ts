import { base, baseSepolia } from "viem/chains";

/**
 * Shared chain + contract config for the Spaghetti City project.
 * All public (NEXT_PUBLIC_) so it is usable from client components.
 * Defaults to Base Sepolia (testnet) until mainnet env is set.
 */
export const CITY_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || baseSepolia.id);
export const cityChain = CITY_CHAIN_ID === base.id ? base : baseSepolia;

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const ADDRESSES = {
  citizenId: process.env.NEXT_PUBLIC_CITIZEN_ID_ADDRESS as `0x${string}` | undefined,
  pastaToken: process.env.NEXT_PUBLIC_PASTA_TOKEN_ADDRESS as `0x${string}` | undefined,
  city: process.env.NEXT_PUBLIC_CITY_ASSETS_ADDRESS as `0x${string}` | undefined,
};

/** Wallet UI can mount once a WalletConnect projectId is configured. */
export const isChainConfigured = () => WALLETCONNECT_PROJECT_ID.length > 0;

/** Contracts are deployed once their addresses are configured. */
export const areContractsConfigured = () =>
  Boolean(ADDRESSES.citizenId && ADDRESSES.pastaToken && ADDRESSES.city);

export const explorerTxUrl = (hash: string) =>
  `${cityChain.blockExplorers?.default.url ?? "https://sepolia.basescan.org"}/tx/${hash}`;
