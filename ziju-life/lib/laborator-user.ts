/**
 * Resolve a Laboratoř user (DB User) from the current request context.
 *
 * Priority:
 * 0. Bearer JWT token (mobile app) — when request is provided
 * 1. user_session cookie → existing DB user
 * 2. lab_email cookie    → get-or-create DB user
 *
 * Returns null when no identity can be resolved.
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyUserSession, getUserByEmail, getOrCreateUser, getAuthenticatedUser, type User } from "@/lib/user-auth";

export async function getLaboratorUser(request?: NextRequest): Promise<User | null> {
  // 0. Try Bearer token (mobile) when request is provided
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return getAuthenticatedUser(request);
    }
  }

  // 1. Prefer existing DB session (magic link login)
  try {
    const user = await verifyUserSession();
    if (user) return user;
  } catch {
    // DB unavailable or no session
  }

  // 2. Fall back to lab_email cookie (Stripe checkout path)
  const cookieStore = await cookies();
  const email = cookieStore.get("lab_email")?.value?.trim();
  if (!email) return null;

  try {
    // get-or-create ensures idempotency
    return await getOrCreateUser(email);
  } catch {
    // DB unavailable
    return null;
  }
}

/** Returns Monday of the ISO week containing `date`, as YYYY-MM-DD. */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}
