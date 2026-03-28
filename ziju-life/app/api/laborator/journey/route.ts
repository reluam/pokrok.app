import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getJourneyData,
  getUserPurchases,
  createFreePurchase,
} from "@/lib/user-auth";
import { checkLaboratorAccess } from "@/lib/laborator-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ data: null, purchaseId: "" });

    const hasAccess = await checkLaboratorAccess(user.email);
    if (!hasAccess) return NextResponse.json({ data: null, purchaseId: "" });

    const purchases = await getUserPurchases(user.id);
    const activePurchase = purchases.find(
      (p) => p.product_slug === "audit-zivota" && !p.completed_at
    );

    let purchaseId = activePurchase?.id ?? "";
    if (!purchaseId) {
      purchaseId = await createFreePurchase(user.id);
    }

    const journeyResult = await getJourneyData(user.id);
    const data = journeyResult?.data ?? null;
    if (journeyResult?.purchaseId) purchaseId = journeyResult.purchaseId;

    return NextResponse.json({ data, purchaseId });
  } catch {
    return NextResponse.json({ data: null, purchaseId: "" });
  }
}
