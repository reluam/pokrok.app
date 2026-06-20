import crypto from "crypto";

/**
 * Tiny HMAC-signed session for the Spaghetti City wallet identity.
 * The cookie holds the SIWE-verified address; the HMAC stops it being forged.
 * Secret falls back through SIWE_SECRET → ADMIN_SECRET (set in Vercel).
 */
function secret(): string {
  return process.env.SIWE_SECRET || process.env.ADMIN_SECRET || "dev-insecure-secret";
}

export function signSession(address: string): string {
  const payload = address.toLowerCase();
  const mac = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

/** Returns the verified address if the token is intact, else null. */
export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const mac = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return payload;
  } catch {
    /* fallthrough */
  }
  return null;
}
