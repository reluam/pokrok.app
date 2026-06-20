import { NextRequest, NextResponse } from "next/server";
import { recoverMessageAddress } from "viem";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { signSession } from "@/lib/spaghetti-city/session";

export const dynamic = "force-dynamic";

/** Issue a one-time nonce for Sign-In With Ethereum. */
export async function GET() {
  const nonce = generateSiweNonce();
  const res = NextResponse.json({ nonce });
  res.cookies.set("sc_nonce", nonce, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
  });
  return res;
}

/** Verify a signed SIWE message and open a session cookie for that address. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message;
  const signature = body?.signature;
  if (typeof message !== "string" || typeof signature !== "string") {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const fields = parseSiweMessage(message);
  const cookieNonce = req.cookies.get("sc_nonce")?.value;
  if (!fields.address || !fields.nonce || fields.nonce !== cookieNonce) {
    return NextResponse.json({ ok: false, error: "nonce mismatch" }, { status: 401 });
  }

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
  } catch {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }
  if (recovered.toLowerCase() !== fields.address.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "address mismatch" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, address: fields.address });
  res.cookies.set("sc_session", signSession(fields.address), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set("sc_nonce", "", { path: "/", maxAge: 0 });
  return res;
}
