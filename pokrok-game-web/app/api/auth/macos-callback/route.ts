import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { userId, sessionId } = await auth()
  
  if (!userId) {
    // Not authenticated, redirect to sign-in
    return redirect('/sign-in')
  }
  
  // Get session token for the macOS app
  // Redirect to macOS app with user info
  const callbackURL = `pokrok://auth/callback?user_id=${userId}&session_id=${sessionId}`
  
  return redirect(callbackURL)
}

