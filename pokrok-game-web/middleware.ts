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
    // Check authentication first
    if (isProtectedRoute(req)) {
      auth.protect()
    }
    
    // For API routes, just return (don't run intl middleware)
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    
    const pathname = req.nextUrl.pathname
    
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
