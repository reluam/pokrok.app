import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import { neon } from '@neondatabase/serverless'

export async function GET(request: Request) {
  const { userId, getToken } = await auth()
  
  if (!userId) {
    // Not authenticated, redirect to sign-in
    return redirect('/sign-in')
  }
  
  // Create a long-lived native app token
  const sql = neon(process.env.DATABASE_URL!)
  
  // Generate a secure random token
  const nativeToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  
  // Store token in database (create table if needed, or use existing session mechanism)
  // For now, we'll store it in a simple native_tokens table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS native_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Delete old tokens for this user
    await sql`DELETE FROM native_tokens WHERE clerk_user_id = ${userId}`
    
    // Insert new token
    await sql`
      INSERT INTO native_tokens (clerk_user_id, token, expires_at)
      VALUES (${userId}, ${nativeToken}, ${expiresAt.toISOString()})
    `
  } catch (error) {
    console.error('Error creating native token:', error)
    return redirect('/sign-in?error=token_creation_failed')
  }
  
  // Redirect to macOS app with native token
  const callbackURL = `pokrok://auth/callback?token=${encodeURIComponent(nativeToken)}&user_id=${userId}`
  
  return redirect(callbackURL)
}
