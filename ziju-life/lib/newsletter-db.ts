import { sql } from './database'
import crypto from 'crypto'

export interface NewsletterSubscriber {
  id: string
  email: string
  createdAt: string
}

export interface PendingSubscription {
  id: string
  email: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export async function addNewsletterSubscriber(email: string): Promise<NewsletterSubscriber> {
  // Check if email already exists
  const existing = await sql`
    SELECT id FROM newsletter_subscribers 
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `

  if (existing.length > 0) {
    throw new Error('Email already subscribed')
  }

  const id = Date.now().toString()
  const now = new Date()

  await sql`
    INSERT INTO newsletter_subscribers (id, email, created_at)
    VALUES (${id}, ${email.toLowerCase().trim()}, ${now})
  `

  return {
    id,
    email: email.toLowerCase().trim(),
    createdAt: now.toISOString(),
  }
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const subscribers = await sql`
    SELECT * FROM newsletter_subscribers
    ORDER BY created_at DESC
  `

  return subscribers.map((sub) => ({
    id: sub.id,
    email: sub.email,
    createdAt: sub.created_at.toISOString(),
  }))
}

export async function deleteNewsletterSubscriber(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM newsletter_subscribers
    WHERE id = ${id}
    RETURNING id
  `

  return result.length > 0
}

export async function deleteNewsletterSubscriberByEmail(email: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM newsletter_subscribers
    WHERE email = ${email.toLowerCase().trim()}
    RETURNING id
  `

  return result.length > 0
}

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Ensure pending subscriptions table exists
async function ensurePendingSubscriptionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_pending_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_token ON newsletter_pending_subscriptions(token)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_email ON newsletter_pending_subscriptions(email)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_expires_at ON newsletter_pending_subscriptions(expires_at)
    `
  } catch (error) {
    // Table might already exist, ignore error
    console.log('Pending subscriptions table check:', error)
  }
}

// Create a pending subscription (before email confirmation)
export async function createPendingSubscription(email: string): Promise<PendingSubscription> {
  // Ensure table exists
  await ensurePendingSubscriptionsTable()
  
  const normalizedEmail = email.toLowerCase().trim()
  
  // Check if email is already subscribed
  const existing = await sql`
    SELECT id FROM newsletter_subscribers 
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `
  
  if (existing.length > 0) {
    throw new Error('Email already subscribed')
  }
  
  // Check if there's already a pending subscription for this email
  const existingPending = await sql`
    SELECT id FROM newsletter_pending_subscriptions 
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `
  
  if (existingPending.length > 0) {
    // Delete old pending subscription
    await sql`
      DELETE FROM newsletter_pending_subscriptions 
      WHERE email = ${normalizedEmail}
    `
  }
  
  const id = Date.now().toString()
  const token = generateToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
  
  await sql`
    INSERT INTO newsletter_pending_subscriptions (id, email, token, expires_at, created_at)
    VALUES (${id}, ${normalizedEmail}, ${token}, ${expiresAt}, ${now})
  `
  
  return {
    id,
    email: normalizedEmail,
    token,
    expiresAt,
    createdAt: now,
  }
}

// Confirm subscription by token
export async function confirmPendingSubscription(token: string): Promise<NewsletterSubscriber> {
  // Ensure table exists
  await ensurePendingSubscriptionsTable()
  
  // Find pending subscription
  const pending = await sql`
    SELECT * FROM newsletter_pending_subscriptions 
    WHERE token = ${token}
    LIMIT 1
  `
  
  if (pending.length === 0) {
    throw new Error('Invalid or expired confirmation token')
  }
  
  const pendingSub = pending[0]
  
  // Check if token has expired
  const now = new Date()
  if (new Date(pendingSub.expires_at) < now) {
    // Delete expired pending subscription
    await sql`
      DELETE FROM newsletter_pending_subscriptions 
      WHERE token = ${token}
    `
    throw new Error('Confirmation token has expired')
  }
  
  // Check if email is already subscribed (race condition check)
  const existing = await sql`
    SELECT id FROM newsletter_subscribers 
    WHERE email = ${pendingSub.email}
    LIMIT 1
  `
  
  if (existing.length > 0) {
    // Already subscribed, just delete pending subscription
    await sql`
      DELETE FROM newsletter_pending_subscriptions 
      WHERE token = ${token}
    `
    throw new Error('Email already subscribed')
  }
  
  // Add to confirmed subscribers
  const id = Date.now().toString()
  await sql`
    INSERT INTO newsletter_subscribers (id, email, created_at)
    VALUES (${id}, ${pendingSub.email}, ${now})
  `
  
  // Delete pending subscription
  await sql`
    DELETE FROM newsletter_pending_subscriptions 
    WHERE token = ${token}
  `
  
  return {
    id,
    email: pendingSub.email,
    createdAt: now.toISOString(),
  }
}
