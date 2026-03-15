import { cookies } from 'next/headers'
import { sql } from './database'

const USER_SESSION_COOKIE = 'user_session'

export type User = {
  id: string
  email: string
  created_at: Date
}

export type Purchase = {
  id: string
  user_id: string
  product_slug: string
  stripe_payment_id: string | null
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

export async function createMagicToken(userId: string): Promise<string> {
  const token = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  const tokenId = `mlt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minut

  await sql`
    INSERT INTO magic_link_tokens (id, user_id, token, expires_at, created_at)
    VALUES (${tokenId}, ${userId}, ${token}, ${expiresAt}, NOW())
  `
  return token
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

export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  const rows = await sql`
    SELECT id, user_id, product_slug, stripe_payment_id, created_at
    FROM purchases
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return rows as unknown as Purchase[]
}
