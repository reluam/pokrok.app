import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

export interface AuthUser {
  username: string
  isAuthenticated: boolean
}

export function verifyCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export function createSession(username: string): string {
  // Simple session token - in production, use a proper JWT or session management
  const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64')
  return sessionToken
}

export function verifySession(sessionToken: string): AuthUser | null {
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
    const [username, timestamp] = decoded.split(':')
    
    // Check if session is not older than 24 hours
    const sessionTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (now - sessionTime > maxAge) {
      return null
    }
    
    if (username === ADMIN_USERNAME) {
      return {
        username,
        isAuthenticated: true
      }
    }
    
    return null
  } catch {
    return null
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const sessionToken = request.cookies.get('admin-session')?.value
  
  if (!sessionToken) {
    return null
  }
  
  return verifySession(sessionToken)
}

export function requireAuth(request: NextRequest): NextResponse | null {
  const user = getAuthUser(request)
  
  if (!user?.isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  
  return null
}
