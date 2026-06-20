# Spaghetti City — contracts

On-chain economy for the **Spaghetti City** project. Self-contained Hardhat workspace (own
`node_modules`, not part of the Next.js build).

## Contracts
- **`CitizenID.sol`** — soulbound (non-transferable) ERC-721 digital identity. One per address.
  Minting is gated to a rotatable `minter` (our relayer) so onboarding is sponsored.
- **`PastaToken.sol`** — `$RAGU` ERC-20 currency. Minter-gated mint (relayer airdrop + City
  yield), burnable so the economy has real sinks.
- **`City.sol`** — ERC-721 parcels + economy. Citizens claim parcels and build (burning `$RAGU`),
  buildings produce `$RAGU` yield over time, and a `$RAGU`-denominated market trades parcels.

## Develop
```bash
cd contracts
npm install
npm run compile
npm test
```
Tests run on Hardhat's in-process EVM — no network, no keys, no cost.

## Deploy (testnet first)
1. Get free Base Sepolia ETH from a faucet for your deployer address.
2. Set env (e.g. a local `contracts/.env`, never committed):
   ```
   DEPLOYER_PRIVATE_KEY=0x...   # throwaway hot key (also acts as relayer/minter)
   OWNER_ADDRESS=0x...          # YOUR real wallet — gets contract ownership/admin (never signs on the server)
   RELAYER_ADDRESS=0x...        # address that mints IDs + airdrops RAGU (defaults to deployer)
   BASE_SEPOLIA_RPC_URL=...     # optional; defaults to https://sepolia.base.org
   ```
3. `npm run deploy:baseSepolia` — prints the deployed addresses and the env block to paste into
   Vercel (`NEXT_PUBLIC_CITIZEN_ID_ADDRESS`, `NEXT_PUBLIC_PASTA_TOKEN_ADDRESS`,
   `NEXT_PUBLIC_CITY_ASSETS_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID`).
4. Only after testnet is verified end-to-end: `npm run deploy:base`.

## Notes
- Spending `$RAGU` (claim/build/buy) requires an ERC-20 `approve(City, amount)` first — a
  deliberate teaching moment about allowances, surfaced in the game UI.
- The relayer key is a hot key: fund it minimally, rate-limit sponsored actions, and rotate via
  `CitizenID.setMinter` / `PastaToken.setMinter` if compromised.
