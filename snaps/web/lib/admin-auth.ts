import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Admin session = tiny HMAC-signed cookie. No JWT lib needed.
 *
 * Format: base64url(payload).base64url(hmac)
 *   payload: { email, exp }  (exp = unix seconds)
 *
 * Signed with ADMIN_SESSION_SECRET (HMAC-SHA256). Only emails in
 * ADMIN_EMAILS (comma-separated env var) can obtain a session.
 */

export const ADMIN_COOKIE_NAME = 'calibrate_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface AdminPayload {
  email: string;
  exp: number;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET must be set (>=16 chars) for admin auth');
  }
  return secret;
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function signAdminSession(email: string): string {
  const payload: AdminPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac('sha256', getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export function verifyAdminSession(token: string | undefined | null): AdminPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = createHmac('sha256', getSecret()).update(payloadB64).digest();
  const providedSig = b64urlDecode(sigB64);
  if (expectedSig.length !== providedSig.length) return null;
  if (!timingSafeEqual(expectedSig, providedSig)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString()) as AdminPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!isAdminEmail(payload.email)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Read current admin session from cookies. Returns null if absent,
 * expired, tampered, or email no longer in ADMIN_EMAILS allowlist.
 */
export async function getAdminSession(): Promise<AdminPayload | null> {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE_NAME)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
