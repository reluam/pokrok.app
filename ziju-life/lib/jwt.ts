import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "ziju-life-jwt-secret";
  return new TextEncoder().encode(secret);
}

export interface JWTPayloadData {
  sub: string; // userId
  email: string;
}

export async function signJWT(payload: JWTPayloadData): Promise<string> {
  return new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayloadData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.email) return null;
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}
