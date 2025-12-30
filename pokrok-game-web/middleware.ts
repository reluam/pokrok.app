import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { locales, type Locale } from './i18n/config'

const isProtectedRoute = createRouteMatcher([
  '/(cs|en)/game(.*)',
  '/game(.*)' // Also protect /game routes without locale prefix
])

// Create intl middleware once (outside of clerkMiddleware)
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Default locale (en) won't have prefix, others will
  localeDetection: false, // Disable auto-detection to prevent unwanted redirects
  alternateLinks: false
})

export default clerkMiddleware(async (auth, req) => {
  try {
    const pathname = req.nextUrl.pathname
    
    // For API routes, check auth but don't redirect - let API handle it
    if (pathname.startsWith('/api/')) {
      // Don't protect API routes here - let each API route handle auth
      return NextResponse.next()
    }
    
    // Redirect sign-in and sign-up routes with locale prefix to versions without prefix
    // This ensures all language versions redirect to pokrok.app/sign-in and pokrok.app/sign-up
    for (const locale of locales) {
      if (pathname.startsWith(`/${locale}/sign-in`) || pathname.startsWith(`/${locale}/sign-up`)) {
        const newPath = pathname.replace(`/${locale}`, '')
        const url = req.nextUrl.clone()
        url.pathname = newPath
        return NextResponse.redirect(url)
      }
    }
    
    // For sign-in and sign-up routes without locale prefix, skip intl middleware
    // to prevent it from adding locale prefix back (which would cause redirect loop)
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      return NextResponse.next()
    }
    
    // Check authentication for protected routes
    if (isProtectedRoute(req)) {
      // Use auth.protect() which handles authentication and redirects
      // This will redirect to sign-in if not authenticated
      auth.protect()
    }
    
    // Then run intl middleware for non-API routes
    return intlMiddleware(req)
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
