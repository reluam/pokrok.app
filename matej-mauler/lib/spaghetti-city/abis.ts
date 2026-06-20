import { parseAbi } from "viem";

/**
 * Client-safe contract ABIs (no node/relayer imports), usable from both the
 * browser (wagmi) and server (viem) sides.
 */
export const citizenAbi = parseAbi([
  "function idOf(address who) view returns (uint256)",
  "function isCitizen(address who) view returns (bool)",
  "function handleOf(uint256 tokenId) view returns (string)",
  "function mint(address to, string handle) returns (uint256)",
  "event CitizenMinted(address indexed to, uint256 indexed tokenId, string handle)",
]);

export const pastaAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const cityAbi = parseAbi([
  "function claim(uint256 id)",
  "function build(uint256 id, uint8 buildingType)",
  "function harvest(uint256 id)",
  "function buy(uint256 id)",
  "function list(uint256 id, uint256 price)",
  "function pending(uint256 id) view returns (uint256)",
  "function ownerOf(uint256 id) view returns (address)",
  "function parcels(uint256 id) view returns (uint8 building, uint8 level, uint64 lastHarvest)",
  "function salePrice(uint256 id) view returns (uint256)",
  "function claimCost() view returns (uint256)",
  "function yieldRate(uint8 buildingType) view returns (uint256)",
  "function buildCost(uint8 buildingType) view returns (uint256)",
  "event ParcelClaimed(address indexed owner, uint256 indexed id)",
  "event Built(uint256 indexed id, uint8 building, uint8 level)",
  "event Harvested(uint256 indexed id, address indexed owner, uint256 amount)",
  "event Listed(uint256 indexed id, uint256 price)",
  "event Bought(uint256 indexed id, address indexed seller, address indexed buyer, uint256 price)",
]);

/** Total parcels = City.GRID (16) squared. Mirrors the on-chain constant. */
export const CITY_GRID = 16;
export const CITY_PARCELS = CITY_GRID * CITY_GRID;
