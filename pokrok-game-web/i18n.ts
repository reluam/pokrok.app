import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './i18n/config'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from './lib/cesta-db'

// Static imports for Vercel compatibility - webpack can properly bundle these
import csMessages from './locales/cs/common.json'
import enMessages from './locales/en/common.json'

export default getRequestConfig(async ({ requestLocale }) => {
  // Since locale is no longer in URL, we need to determine it from cookies, user settings, or browser
  let locale: Locale | null = null
  
  // Priority 1: Cookie (set by middleware or LanguageSwitcher) - check first
  // This is the most immediate source of truth
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale
    console.log(`[i18n] Using cookie locale: ${locale}`)
  }
  
  // Priority 2: User's database preference (for authenticated users)
  // Only use if cookie is not set or invalid
  if (!locale) {
    try {
      const { userId: clerkUserId } = await auth()
      if (clerkUserId) {
        const dbUser = await getUserByClerkId(clerkUserId)
        if (dbUser?.preferred_locale && locales.includes(dbUser.preferred_locale as Locale)) {
          locale = dbUser.preferred_locale as Locale
          console.log(`[i18n] Using user's database preference: ${locale}`)
        } else {
          console.log(`[i18n] User has no database preference`)
        }
      }
    } catch (error) {
      // If we can't get user locale, continue to next priority
      console.error('[i18n] Error getting user locale:', error)
    }
  }

  // Priority 3: requestLocale from middleware (browser detection for non-authenticated users)
  if (!locale) {
    const requestLocaleValue = await requestLocale
    if (requestLocaleValue && locales.includes(requestLocaleValue as Locale)) {
      locale = requestLocaleValue as Locale
      console.log(`[i18n] Using browser detection: ${locale}`)
    }
  }

  // Fallback: Default to Czech
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'cs' // Default to Czech
    console.log(`[i18n] Using default locale: ${locale}`)
  }
  
  console.log(`[i18n] Final locale decision: ${locale}`)

  // Use static imports instead of dynamic - this works reliably on Vercel
  // Webpack can properly bundle static imports, but dynamic imports with template literals can fail
  let messages
  try {
    switch (locale) {
      case 'cs':
        messages = csMessages
        break
      case 'en':
        messages = enMessages
        break
      default:
        messages = enMessages // Fallback to English
        locale = 'en'
    }
    
    // Validate that messages were loaded successfully
    if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
      throw new Error(`Messages are empty for locale: ${locale}`)
    }
    
    console.log(`[i18n] Successfully loaded ${Object.keys(messages).length} message keys for locale: ${locale}`)
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error)
    
    // Fallback to English if other locale fails
    if (locale !== 'en') {
      console.warn(`[i18n] Attempting to load English fallback messages`)
      messages = enMessages
      locale = 'en'
      
      // Validate fallback messages
      if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
        console.error('[i18n] English fallback messages are also empty')
        messages = {} // Last resort: empty messages
      } else {
        console.log(`[i18n] Successfully loaded ${Object.keys(messages).length} English fallback message keys`)
      }
    } else {
      console.error('[i18n] Failed to load English messages (default locale) - using empty messages')
      messages = {} // Last resort: empty messages
    }
  }

  return {
    locale,
    messages
  }
})

