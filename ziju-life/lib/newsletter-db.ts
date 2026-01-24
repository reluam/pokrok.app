import { sql } from './database'

export interface NewsletterSubscriber {
  id: string
  email: string
  createdAt: string
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
