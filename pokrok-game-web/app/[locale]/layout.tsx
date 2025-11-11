import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/cesta-db'
import { locales, type Locale } from '@/i18n/config'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Note: generateStaticParams is removed to force dynamic rendering
// This is necessary because pages require user authentication and cannot be statically generated

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Check user's preferred locale from database and redirect if different
  // This ensures users see their preferred language when they visit the site
  try {
    const { userId: clerkUserId } = await auth()
    if (clerkUserId) {
      const user = await getUserByClerkId(clerkUserId)
      if (user?.preferred_locale && locales.includes(user.preferred_locale as Locale)) {
        // If user has a preferred locale and it's different from current URL locale, redirect
        if (user.preferred_locale !== locale) {
          // Get the current pathname from headers to preserve the route
          const headersList = await headers()
          // Try to get pathname from various headers
          const pathname = headersList.get('x-pathname') || 
                          headersList.get('x-invoke-path') || 
                          headersList.get('referer')?.split('?')[0] || 
                          ''
          
          // Extract the path after locale (e.g., /cs/game -> /game, /game -> /game)
          let pathWithoutLocale = pathname.replace(/^\/(cs|en)/, '') || '/game'
          
          // Ensure path starts with /
          if (!pathWithoutLocale.startsWith('/')) {
            pathWithoutLocale = '/' + pathWithoutLocale
          }
          
          // Redirect to same path with preferred locale
          // If preferred locale is default (cs), use path without prefix
          const newPath = user.preferred_locale === 'cs' 
            ? pathWithoutLocale 
            : `/${user.preferred_locale}${pathWithoutLocale}`
          redirect(newPath)
        }
      }
    }
  } catch (error) {
    // If we can't get user or DB fails, continue with current locale
    // This prevents the page from crashing if DB is unavailable
    console.error('[layout] Error checking user preferred locale:', error)
  }

  // Load messages with error handling and fallback
  let messages
  try {
    messages = await getMessages({ locale })
    
    // Validate that messages were loaded successfully
    if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
      console.error(`[layout] Messages are empty for locale: ${locale}`)
      // Try to load Czech as fallback
      if (locale !== 'cs') {
        try {
          messages = await getMessages({ locale: 'cs' })
          console.warn(`[layout] Using Czech fallback messages for locale: ${locale}`)
        } catch (fallbackError) {
          console.error('[layout] Failed to load fallback Czech messages:', fallbackError)
          messages = {} // Last resort: empty messages
        }
      } else {
        messages = {} // Last resort: empty messages
      }
    }
  } catch (error) {
    console.error(`[layout] Failed to load messages for locale ${locale}:`, error)
    // Try to load Czech as fallback
    if (locale !== 'cs') {
      try {
        messages = await getMessages({ locale: 'cs' })
        console.warn(`[layout] Using Czech fallback messages for locale: ${locale}`)
      } catch (fallbackError) {
        console.error('[layout] Failed to load fallback Czech messages:', fallbackError)
        messages = {} // Last resort: empty messages
      }
    } else {
      messages = {} // Last resort: empty messages
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

