import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './i18n/config'

// Static imports for Vercel compatibility - webpack can properly bundle these
import csMessages from './locales/cs/common.json'
import enMessages from './locales/en/common.json'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  // The middleware handles redirecting to user's preferred locale from database
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    console.warn(`[i18n] Invalid locale: ${locale}, defaulting to 'cs'`)
    locale = 'cs' // Default to Czech
  }

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
        messages = csMessages // Fallback to Czech
        locale = 'cs'
    }
    
    // Validate that messages were loaded successfully
    if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
      throw new Error(`Messages are empty for locale: ${locale}`)
    }
    
    console.log(`[i18n] Successfully loaded ${Object.keys(messages).length} message keys for locale: ${locale}`)
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error)
    
    // Fallback to Czech if other locale fails
    if (locale !== 'cs') {
      console.warn(`[i18n] Attempting to load Czech fallback messages`)
      messages = csMessages
      locale = 'cs'
      
      // Validate fallback messages
      if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
        console.error('[i18n] Czech fallback messages are also empty')
        messages = {} // Last resort: empty messages
      } else {
        console.log(`[i18n] Successfully loaded ${Object.keys(messages).length} Czech fallback message keys`)
      }
    } else {
      console.error('[i18n] Failed to load Czech messages (default locale) - using empty messages')
      messages = {} // Last resort: empty messages
    }
  }

  return {
    locale,
    messages
  }
})

