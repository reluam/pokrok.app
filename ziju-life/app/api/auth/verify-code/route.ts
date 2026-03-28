import { NextRequest, NextResponse } from "next/server";
import { verifyMagicCode, createUserSession } from "@/lib/user-auth";
import { signJWT } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, source } = body;

    if (!email || !code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Zadej 6místný kód z e-mailu." },
        { status: 400 }
      );
    }

    const user = await verifyMagicCode(email.trim().toLowerCase(), code.trim());

    if (!user) {
      return NextResponse.json(
        { error: "Neplatný nebo vypršelý kód. Zkus to znovu." },
        { status: 401 }
      );
    }

    // Mobile: return JWT
    if (source === "mobile") {
      const accessToken = await signJWT({ sub: user.id, email: user.email });
      return NextResponse.json({
        ok: true,
        accessToken,
        user: { id: user.id, email: user.email },
      });
    }

    // Web: create cookie session
    await createUserSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("[verify-code] Error:", err);
    return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 });
  }
}
