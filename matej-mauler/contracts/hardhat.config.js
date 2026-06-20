require("@nomicfoundation/hardhat-toolbox");

/**
 * Spaghetti City contracts.
 * Networks read keys from env (set locally or in CI — never committed):
 *   DEPLOYER_PRIVATE_KEY  — funded deployer (Base Sepolia testnet ETH is free from a faucet)
 *   BASE_SEPOLIA_RPC_URL  — defaults to the public Base Sepolia RPC
 *   BASE_RPC_URL          — defaults to the public Base mainnet RPC
 *   RELAYER_ADDRESS       — address allowed to mint CitizenID + airdrop RAGU (defaults to deployer)
 */
const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.28",
    // Base supports the Cancun upgrade (MCOPY etc.), which recent OpenZeppelin requires.
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts,
    },
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
      accounts,
    },
  },
};
