import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { sql } from './database'
import { verifyJWT } from './jwt'

const USER_SESSION_COOKIE = 'user_session'

export type User = {
  id: string
  email: string
  created_at: Date
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = (await sql`
    SELECT id, email, created_at FROM users WHERE email = ${email} LIMIT 1
  `) as User[]
  return rows[0] ?? null
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = (await sql`
    SELECT id, email, created_at FROM users WHERE id = ${id} LIMIT 1
  `) as User[]
  return rows[0] ?? null
}

export async function getOrCreateUser(email: string): Promise<User> {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const rows = (await sql`
    INSERT INTO users (id, email, created_at)
    VALUES (${id}, ${email}, NOW())
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email, created_at
  `) as User[]
  return rows[0]
}

export async function createMagicToken(userId: string): Promise<{ token: string; code: string }> {
  const token = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  const code = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit code
  const tokenId = `mlt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minut

  // Ensure code column exists
  try {
    await sql`ALTER TABLE magic_link_tokens ADD COLUMN IF NOT EXISTS code VARCHAR(6)`
  } catch {}

  await sql`
    INSERT INTO magic_link_tokens (id, user_id, token, code, expires_at, created_at)
    VALUES (${tokenId}, ${userId}, ${token}, ${code}, ${expiresAt}, NOW())
  `
  return { token, code }
}

export async function verifyMagicToken(token: string): Promise<User | null> {
  const rows = (await sql`
    SELECT mlt.user_id, u.email, u.created_at
    FROM magic_link_tokens mlt
    JOIN users u ON u.id = mlt.user_id
    WHERE mlt.token = ${token}
      AND mlt.expires_at > NOW()
      AND mlt.used_at IS NULL
    LIMIT 1
  `) as { user_id: string; email: string; created_at: Date }[]

  if (!rows[0]) return null

  await sql`UPDATE magic_link_tokens SET used_at = NOW() WHERE token = ${token}`

  return { id: rows[0].user_id, email: rows[0].email, created_at: rows[0].created_at }
}

export async function verifyMagicCode(email: string, code: string): Promise<User | null> {
  const rows = (await sql`
    SELECT mlt.user_id, mlt.token, u.email, u.created_at
    FROM magic_link_tokens mlt
    JOIN users u ON u.id = mlt.user_id
    WHERE u.email = ${email.toLowerCase()}
      AND mlt.code = ${code}
      AND mlt.expires_at > NOW()
      AND mlt.used_at IS NULL
    ORDER BY mlt.created_at DESC
    LIMIT 1
  `) as { user_id: string; token: string; email: string; created_at: Date }[]

  if (!rows[0]) return null

  await sql`UPDATE magic_link_tokens SET used_at = NOW() WHERE token = ${rows[0].token}`

  return { id: rows[0].user_id, email: rows[0].email, created_at: rows[0].created_at }
}

export async function createUserSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(USER_SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dní
  })
}

export async function verifyUserSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(USER_SESSION_COOKIE)
  if (!session?.value) return null
  return getUserById(session.value)
}

export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(USER_SESSION_COOKIE)
}

/**
 * Extract email from Bearer JWT token if present.
 * Returns undefined if no Bearer token or invalid.
 */
export async function getEmailFromBearer(request: NextRequest): Promise<string | undefined> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return undefined
  const payload = await verifyJWT(authHeader.slice(7))
  return payload?.email
}

/**
 * Authenticate user from a NextRequest.
 * Tries Bearer JWT token first (mobile app), then falls back to cookie session (web).
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  // 1. Try Bearer token (mobile)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = await verifyJWT(token)
    if (payload?.sub) {
      return getUserById(payload.sub)
    }
    return null
  }

  // 2. Fall back to cookie session (web)
  return verifyUserSession()
}
