// Called by protected pages on every load.
// Uses checkLaboratorAccess() — checks both admin grants and Stripe subscription.

import { NextResponse } from "next/server";
import { checkLaboratorAccess } from "@/lib/laborator-auth";
import { verifyUserSession } from "@/lib/user-auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const valid = await checkLaboratorAccess();

    if (!valid) {
      return NextResponse.json({ valid: false });
    }

    // Resolve email for display
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
