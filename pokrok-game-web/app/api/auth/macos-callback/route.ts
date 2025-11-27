import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { userId, getToken } = await auth()
  
  if (!userId) {
    // Not authenticated, redirect to sign-in
    return redirect('/sign-in')
  }
  
  // Get session token (JWT) for the macOS app
  const token = await getToken()
  
  if (!token) {
    return redirect('/sign-in?error=no_token')
  }
  
  // Redirect to macOS app with JWT token
  // Token is safe to pass in URL as it's short-lived and will be validated server-side
  const callbackURL = `pokrok://auth/callback?token=${encodeURIComponent(token)}&user_id=${userId}`
  
  return redirect(callbackURL)
}
