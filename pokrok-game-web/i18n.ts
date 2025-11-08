import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './i18n/config'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  // The middleware handles redirecting to user's preferred locale from database
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'cs' // Default to Czech
  }

  // Dynamic import - Next.js webpack will bundle these JSON files correctly
  // This works both locally and on Vercel
  try {
    const messages = (await import(`./locales/${locale}/common.json`)).default
    return { locale, messages }
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error)
    
    // Fallback to Czech if other locale fails
    if (locale !== 'cs') {
      try {
        const fallbackMessages = (await import(`./locales/cs/common.json`)).default
        return {
          locale: 'cs',
          messages: fallbackMessages
        }
      } catch (fallbackError) {
        console.error('[i18n] Failed to load fallback messages:', fallbackError)
      }
    }
    
    // Last resort: return empty messages to prevent crash
    return {
      locale,
      messages: {}
    }
  }
})

