# Spaghetti City — setup & status

On-chain ekonomická simulace s blockchainovou identitou. Samostatný projekt; veřejný web
funguje beze změny i bez peněženky.

## Co už je hotové (a ověřené)
- **Kontrakty** (`/contracts`): `CitizenID` (soulbound), `PastaToken` ($RAGU), `City`
  (parcely + ekonomika + trh). 14/14 testů prochází (`cd contracts && npm test`).
- **Projekt** je zaregistrovaný jako *draft* (skrytý na produkci, viditelný na Vercel preview),
  route `/spaghetti-city`, landing s edukativním úvodem.
- **Peněženka + identita**: připojení (RainbowKit) + přihlášení podpisem (SIWE) →
  `app/api/spaghetti-city/siwe`.
- **Sponsored onboarding**: po přihlášení „získat občanství" → relayer mintne soulbound ID
  a airdropne 1000 $RAGU (`app/api/spaghetti-city/citizen`). Stav občana + odkaz na transakci.
- Vše typuje, lintuje a `next build` prochází. Onboarding záznamy se cachují do `city_*` tabulek
  (`lib/cityDb.ts`).

## Co je potřeba nastavit, aby to BĚŽELO (testnet first)
1. **WalletConnect projectId** (zdarma) z https://cloud.reown.com → `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
   Bez něj se wallet UI nenamountuje (zobrazí se „nastavuje se") — web tím není nijak rozbitý.
2. **Deploy kontraktů na Base Sepolia** (testovací ETH zdarma z faucetu):
   ```bash
   cd contracts && npm install
   DEPLOYER_PRIVATE_KEY=0x... npm run deploy:baseSepolia
   ```
   Skript vypíše adresy + hotový env blok.
3. **Env do Vercelu** (a lokálně do `.env.local` pro `next dev`):
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   NEXT_PUBLIC_CHAIN_ID=84532
   NEXT_PUBLIC_CITIZEN_ID_ADDRESS=0x...
   NEXT_PUBLIC_PASTA_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_CITY_ASSETS_ADDRESS=0x...
   RELAYER_PRIVATE_KEY=0x...      # hot wallet, drž jen pár $ ETH na Base Sepolia
   SIWE_SECRET=<náhodný řetězec>  # pro podpis session cookie (jinak fallback na ADMIN_SECRET)
   # volitelně CITY_RPC_URL pro vlastní RPC
   ```
   Relayer musí být na kontraktech nastaven jako minter — deploy skript to udělá, pokud
   `RELAYER_ADDRESS` == adresa z `RELAYER_PRIVATE_KEY` (jinak zavolej `setMinter` ručně).

## Bezpečnost
- `RELAYER_PRIVATE_KEY` je hot klíč: financuj minimálně, je jen minter (nedrží hodnotu mimo gas),
  a jde rotovat přes `CitizenID.setMinter` / `PastaToken.setMinter` bez redeploye.

## Herní deska (Milník 4 — hotovo)
- Read API `app/api/spaghetti-city/state` — přečte celou mřížku 16×16 přes Multicall3
  (`publicClient` má `batch.multicall`), vrací jen obsazené parcely + ekonomické parametry.
- UI `components/spaghetti-city/CityBoard.tsx` — mapa parcel + akční panel: claim, stavba/upgrade,
  harvest, prodej/nákup na trhu (přes wagmi `useWriteContract`, gas platí hráč). Po každé akci
  overlay „zapsáno na blockchain" s odkazem na BaseScan (edukace).
- Pozn.: místo cron event-indexeru použito multicall čtení přímo z chainu (vždy aktuální,
  jednodušší). Event indexer do `city_*` cache zůstává jako pozdější optimalizace, ne nutnost.

## Další (Milník 5)
Edukativní onboarding průvodce „proč a jak na peněženku" (co je peněženka, podpis, gas, SBT vs NFT,
$RAGU) — interaktivně, navazuje na vstup do města. Pak polish, gas-mode přepínač a přechod na
Base mainnet.
