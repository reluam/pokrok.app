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

  try {
    const messages = (await import(`./locales/${locale}/common.json`)).default
    return {
      locale,
      messages
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    // Fallback to Czech if locale file doesn't exist
    const fallbackMessages = (await import(`./locales/cs/common.json`)).default
    return {
      locale: 'cs',
      messages: fallbackMessages
    }
  }
})

