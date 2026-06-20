"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { useState, type ReactNode } from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cityChain, WALLETCONNECT_PROJECT_ID } from "@/lib/cityChain";

/**
 * Web3 provider boundary for the Spaghetti City project ONLY.
 * Mounted lazily (ssr:false) via CityGate so wallet code never touches the
 * public site's SSR or bundle. Config is built on mount, so it only runs when
 * a WalletConnect projectId is configured.
 */
export function Web3Providers({ children }: { children: ReactNode }) {
  const [config] = useState(() =>
    getDefaultConfig({
      appName: "Spaghetti City",
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [cityChain],
      ssr: false,
    })
  );
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
