import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateUser, mergeSessionIntoUser } from "../accountsDb";
import { recomputeUserRewards } from "../rewards/evaluate";

const ANON_COOKIE = "sp_anon";
const ANON_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Read the anon session id. In a route handler / server action you can pass create=true to
 *  mint + persist one (cookies are only writable there, not in Server Components). */
export async function getAnonSessionId(create = false): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(ANON_COOKIE)?.value;
  if (existing) return existing;
  if (!create) return null;
  const id = crypto.randomUUID();
  jar.set(ANON_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: ANON_MAX_AGE });
  return id;
}

/** Sync the signed-in Clerk user into our users row (lazy profile sync) and, if there's a
 *  pending anonymous session, merge its data in and recompute rewards. Safe in both Server
 *  Components (read-only) and route handlers. Returns null when not signed in. */
export async function syncAuthedUser(): Promise<{ clerkId: string; userId: string } | null> {
  // Clerk off (no keys) → everyone is anonymous; auth() would throw without clerkMiddleware.
  if (!process.env.CLERK_SECRET_KEY) return null;

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
  const displayName = user?.fullName || user?.username || null;
  const appUser = await getOrCreateUser(clerkId, email, displayName);

  const jar = await cookies();
  const anon = jar.get(ANON_COOKIE)?.value;
  if (anon) {
    const moved = await mergeSessionIntoUser(anon, appUser.id);
    if (moved > 0) await recomputeUserRewards(appUser.id);
    // Clear the cookie when writable (route handler / action); harmless no-op/throw in RSC.
    try {
      jar.delete(ANON_COOKIE);
    } catch {
      /* Server Component — cookie stays; merge is idempotent so it's fine. */
    }
  }

  return { clerkId, userId: appUser.id };
}

/** Resolve who is acting for a participation: a synced user, or an anon session (minted here). */
export async function resolveParticipationActor(): Promise<{ userId: string | null; sessionId: string | null }> {
  const synced = await syncAuthedUser();
  if (synced) return { userId: synced.userId, sessionId: null };
  const sessionId = await getAnonSessionId(true);
  return { userId: null, sessionId };
}
