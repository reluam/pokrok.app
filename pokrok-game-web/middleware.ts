import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { locales, type Locale } from './i18n/config'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from './lib/cesta-db'

const isProtectedRoute = createRouteMatcher([
  '/game(.*)',
  '/main-panel(.*)',
  '/goals(.*)',
  '/habits(.*)',
  '/steps(.*)',
  '/settings(.*)',
  '/help(.*)',
  '/workflows(.*)',
  '/areas(.*)',
  '/statistics(.*)',
  '/achievements(.*)'
])

// Create intl middleware once (outside of clerkMiddleware)
// Using 'never' means locale won't appear in URL, but we still need [locale] segment in app structure
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'cs', // Czech as default
  localePrefix: 'never', // Never show locale in URL - use user settings/cookies instead
  localeDetection: true, // Enable browser detection for non-authenticated users
  alternateLinks: false
})

export default clerkMiddleware(async (authReq, req) => {
  try {
    const pathname = req.nextUrl.pathname
    
    // Handle OPTIONS requests (CORS preflight) - return 200 with CORS headers
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
    
    // For API routes, check auth but don't redirect - let API handle it
    if (pathname.startsWith('/api/')) {
      // Don't protect API routes here - let each API route handle auth
      return NextResponse.next()
    }
    
    // Redirect old locale-prefixed routes to non-prefixed versions
    // This handles migration from old URL structure to new one without locale in URL
    for (const locale of locales) {
      if (pathname.startsWith(`/${locale}/`)) {
        const newPath = pathname.replace(`/${locale}`, '')
        const url = req.nextUrl.clone()
        url.pathname = newPath
        return NextResponse.redirect(url)
      } else if (pathname === `/${locale}`) {
        const url = req.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
    
    // Redirect /game to /main-panel for backward compatibility
    if (pathname === '/game') {
      const url = req.nextUrl.clone()
      url.pathname = '/main-panel'
      return NextResponse.redirect(url)
    }
    
    // Check authentication for protected routes
    if (isProtectedRoute(req)) {
      // Use auth.protect() which handles authentication and redirects
      // This will redirect to sign-in if not authenticated
      authReq.protect()
    }
    
    // For authenticated users, get database preference first
    // This will be used to override intl middleware's decision
    let userLocale: Locale | null = null
    try {
      const { userId: clerkUserId } = await auth()
      if (clerkUserId) {
        const dbUser = await getUserByClerkId(clerkUserId)
        if (dbUser?.preferred_locale && locales.includes(dbUser.preferred_locale as Locale)) {
          userLocale = dbUser.preferred_locale as Locale
          console.log(`[Middleware] User has database preference: ${userLocale}`)
        } else {
          console.log(`[Middleware] User has no database preference, will use browser detection`)
        }
      }
    } catch (error) {
      console.error('[Middleware] Error getting user locale:', error)
    }
    
    // Run intl middleware - it will use browser detection or cookies
    const response = await intlMiddleware(req)
    
    // If we have a user locale preference from database, override the cookie
    // This ensures authenticated users always use their saved preference
    if (userLocale && response) {
      console.log(`[Middleware] Setting cookie to user preference: ${userLocale}`)
      response.cookies.set('NEXT_LOCALE', userLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax'
      })
    }
    
    return response
  } catch (error) {
    // If middleware fails, log error with more details
    console.error('Middleware error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname: req.nextUrl.pathname,
      url: req.url
    })
    
    // Fallback: try to continue with basic response
    try {
      // For API routes, just continue
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next()
      }
      
      // For protected routes, redirect to sign-in on error
      if (isProtectedRoute(req)) {
        const signInUrl = new URL('/sign-in', req.url)
        return NextResponse.redirect(signInUrl)
      }
      
      // Try intl middleware as fallback
      return intlMiddleware(req)
    } catch (intlError) {
      console.error('Intl middleware also failed:', intlError)
      // Last resort: return a basic response to prevent complete failure
      return NextResponse.next()
    }
  }
})

export const config = {
  matcher: [
    // Include API routes for Clerk auth, but exclude internal paths
    '/((?!_next|trpc|.*\\..*).*)',
    // Optional: only run on root (/) URL
    '/'
  ],
}
