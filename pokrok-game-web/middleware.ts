import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { locales, type Locale } from './i18n/config'
import { getUserByClerkId } from './lib/cesta-db'

const isProtectedRoute = createRouteMatcher([
  '/(cs|en)/game(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Log hostname for debugging redirect issues
  const hostname = req.headers.get('host') || ''
  if (hostname.includes('www.pokrok.app')) {
    console.log(`[middleware] WARNING: Request from www.pokrok.app - should redirect to pokrok.app`)
  }
  
  // Check authentication first
  if (isProtectedRoute(req)) {
    auth.protect()
  }
  
  // For API routes, just return (don't run intl middleware)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }
  
  // Create intl middleware with custom locale detection from database
  const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'cs',
    localePrefix: 'always',
    localeDetection: false, // Disable browser detection
    // Custom locale detection from database
    alternateLinks: false
  })
  
  // Try to get user's preferred locale from database and redirect if needed
  try {
    const { userId: clerkUserId } = await auth()
    if (clerkUserId) {
      const user = await getUserByClerkId(clerkUserId)
      if (user?.preferred_locale && locales.includes(user.preferred_locale as Locale)) {
        const currentPath = req.nextUrl.pathname
        const currentLocale = currentPath.split('/')[1]
        
        // If user is on a different locale than preferred, redirect to preferred
        if (currentLocale !== user.preferred_locale && !currentPath.startsWith('/api/')) {
          const newPath = currentPath.replace(/^\/(cs|en)/, `/${user.preferred_locale}`)
          return Response.redirect(new URL(newPath, req.url))
        }
      }
    }
  } catch (error) {
    // If we can't get user, continue with normal flow
    console.error('Error getting user preferred locale in middleware:', error)
  }
  
  // Then run intl middleware for non-API routes
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    // Include API routes for Clerk auth, but exclude internal paths
    '/((?!_next|trpc|.*\\..*).*)',
    // Optional: only run on root (/) URL
    '/'
  ],
}
