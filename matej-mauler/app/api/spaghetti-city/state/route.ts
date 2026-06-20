import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { ADDRESSES, areContractsConfigured } from "@/lib/cityChain";
import { cityAbi, CITY_PARCELS } from "@/lib/spaghetti-city/abis";
import { publicClient } from "@/lib/spaghetti-city/contracts";
import { countCitizens } from "@/lib/cityDb";

export const dynamic = "force-dynamic";

type ParcelOut = {
  id: number;
  owner: string;
  building: number;
  level: number;
  lastHarvest: number;
  salePrice: string; // formatted RAGU; "0" = not for sale
};

/**
 * Full city board read in a couple of round-trips via Multicall3.
 * Source of truth is the chain; only owned parcels are returned (empty/unowned
 * cells are implied). Currency values are formatted RAGU strings.
 */
export async function GET() {
  if (!areContractsConfigured()) {
    return NextResponse.json({ ok: false, error: "on-chain not configured", parcels: [] }, { status: 503 });
  }

  const city = ADDRESSES.city!;
  const pc = publicClient(); // batches parallel reads into Multicall3 automatically

  try {
    const [claimCost, yieldRate, buildCost] = await Promise.all([
      pc.readContract({ address: city, abi: cityAbi, functionName: "claimCost" }),
      pc.readContract({ address: city, abi: cityAbi, functionName: "yieldRate", args: [1] }),
      pc.readContract({ address: city, abi: cityAbi, functionName: "buildCost", args: [1] }),
    ]);

    const ids = Array.from({ length: CITY_PARCELS }, (_, i) => i);
    // ownerOf reverts for unowned parcels → catch to null; only those are "on the map".
    const owners = await Promise.all(
      ids.map((id) =>
        pc
          .readContract({ address: city, abi: cityAbi, functionName: "ownerOf", args: [BigInt(id)] })
          .then((o) => o as string)
          .catch(() => null)
      )
    );
    const ownedIds = ids.filter((id) => owners[id] !== null);

    const [parcelData, salePrices] = await Promise.all([
      Promise.all(
        ownedIds.map((id) => pc.readContract({ address: city, abi: cityAbi, functionName: "parcels", args: [BigInt(id)] }))
      ),
      Promise.all(
        ownedIds.map((id) => pc.readContract({ address: city, abi: cityAbi, functionName: "salePrice", args: [BigInt(id)] }))
      ),
    ]);

    const parcels: ParcelOut[] = ownedIds.map((id, i) => {
      const [building, level, lastHarvest] = parcelData[i];
      return {
        id,
        owner: (owners[id] as string).toLowerCase(),
        building: Number(building),
        level: Number(level),
        lastHarvest: Number(lastHarvest),
        salePrice: formatEther(salePrices[i]),
      };
    });

    const citizens = await countCitizens().catch(() => 0);

    return NextResponse.json({
      ok: true,
      economy: {
        claimCost: formatEther(claimCost),
        yieldRatePerSec: formatEther(yieldRate),
        buildCost: formatEther(buildCost),
      },
      citizens,
      parcels,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "read failed";
    return NextResponse.json({ ok: false, error: msg, parcels: [] }, { status: 500 });
  }
}
