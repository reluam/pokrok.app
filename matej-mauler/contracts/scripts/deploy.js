const { ethers, network } = require("hardhat");

/**
 * Deploys the Spaghetti City contract suite and wires roles.
 * Run against Base Sepolia first:  npm run deploy:baseSepolia
 * Requires env: DEPLOYER_PRIVATE_KEY (funded), optionally RELAYER_ADDRESS.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const relayer = process.env.RELAYER_ADDRESS || deployer.address;

  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("Relayer (CitizenID minter + airdrop):", relayer);

  const citizen = await (await ethers.getContractFactory("CitizenID")).deploy(deployer.address);
  await citizen.waitForDeployment();

  const pasta = await (await ethers.getContractFactory("PastaToken")).deploy(deployer.address);
  await pasta.waitForDeployment();

  const city = await (await ethers.getContractFactory("City")).deploy(
    deployer.address,
    await citizen.getAddress(),
    await pasta.getAddress()
  );
  await city.waitForDeployment();

  // Wiring (must run while the deployer is still the owner)
  await (await citizen.setMinter(relayer)).wait();
  await (await pasta.setMinter(relayer, true)).wait();
  await (await pasta.setMinter(await city.getAddress(), true)).wait();

  // Hand admin/ownership to your real wallet (it never needs to sign anything else).
  const owner = process.env.OWNER_ADDRESS;
  if (owner && owner.toLowerCase() !== deployer.address.toLowerCase()) {
    await (await citizen.transferOwnership(owner)).wait();
    await (await pasta.transferOwnership(owner)).wait();
    await (await city.transferOwnership(owner)).wait();
    console.log("Ownership transferred to:", owner);
  }

  const citizenAddr = await citizen.getAddress();
  const pastaAddr = await pasta.getAddress();
  const cityAddr = await city.getAddress();

  console.log("\nDeployed:");
  console.log("  CitizenID :", citizenAddr);
  console.log("  PastaToken:", pastaAddr);
  console.log("  City      :", cityAddr);

  console.log("\nAdd to Vercel env (and to contracts/.env for scripts):");
  console.log("NEXT_PUBLIC_CITIZEN_ID_ADDRESS=" + citizenAddr);
  console.log("NEXT_PUBLIC_PASTA_TOKEN_ADDRESS=" + pastaAddr);
  console.log("NEXT_PUBLIC_CITY_ASSETS_ADDRESS=" + cityAddr);
  console.log(
    "NEXT_PUBLIC_CHAIN_ID=" + (network.name === "base" ? "8453" : network.name === "baseSepolia" ? "84532" : "?")
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
