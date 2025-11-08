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

  // Load messages with explicit path resolution for Vercel compatibility
  let messages
  try {
    // Use dynamic import with explicit path
    const messagesModule = await import(`./locales/${locale}/common.json`)
    messages = messagesModule.default || messagesModule
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error)
    // Fallback to Czech if other locale fails
    if (locale !== 'cs') {
      try {
        const fallbackModule = await import('./locales/cs/common.json')
        messages = fallbackModule.default || fallbackModule
        locale = 'cs'
      } catch (fallbackError) {
        console.error('[i18n] Failed to load fallback messages:', fallbackError)
        messages = {}
      }
    } else {
      messages = {}
    }
  }

  return {
    locale,
    messages
  }
})

