import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken } from "@/lib/user-auth";
import { signJWT } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token je povinný." }, { status: 400 });
    }

    const user = await verifyMagicToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Neplatný nebo vypršelý odkaz. Vyžádej si nový." },
        { status: 401 }
      );
    }

    const accessToken = await signJWT({ sub: user.id, email: user.email });

    return NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("[verify-mobile] Error:", err);
    return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 });
  }
}
