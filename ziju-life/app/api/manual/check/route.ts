// Called by protected pages on every load.
// Uses checkManualAccess() — checks both admin grants and Stripe subscription.

import { NextRequest, NextResponse } from "next/server";
import { checkManualAccess } from "@/lib/manual-auth";
import { getEmailFromBearer, verifyUserSession } from "@/lib/user-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Try Bearer token first (mobile), then cookies (web)
    const bearerEmail = await getEmailFromBearer(request);

    const valid = await checkManualAccess(bearerEmail);

    if (!valid) {
      return NextResponse.json({ valid: false });
    }

    // Resolve email for display
    if (bearerEmail) {
      return NextResponse.json({ valid: true, email: bearerEmail });
    }

    const cookieStore = await cookies();
    const cookieEmail = cookieStore.get("lab_email")?.value?.trim();
    let sessionEmail: string | undefined;
    try {
      const user = await verifyUserSession();
      sessionEmail = user?.email;
    } catch {
      // ignore
    }
    const email = cookieEmail || sessionEmail || "";

    return NextResponse.json({ valid: true, email });
  } catch (err) {
    console.error("[laborator check]", err);
    return NextResponse.json({ valid: false });
  }
}
