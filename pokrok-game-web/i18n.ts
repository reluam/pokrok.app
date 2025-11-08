import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './i18n/config'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  // The middleware handles redirecting to user's preferred locale from database
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    console.warn(`[i18n] Invalid locale: ${locale}, defaulting to 'cs'`)
    locale = 'cs' // Default to Czech
  }

  // Load messages with explicit path resolution for Vercel compatibility
  let messages
  try {
    // Use dynamic import with explicit path
    const messagesModule = await import(`./locales/${locale}/common.json`)
    messages = messagesModule.default || messagesModule
    
    // Validate that messages were loaded successfully
    if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
      throw new Error(`Messages are empty for locale: ${locale}`)
    }
    
    console.log(`[i18n] Successfully loaded ${Object.keys(messages).length} message keys for locale: ${locale}`)
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error)
    
    // Fallback to Czech if other locale fails
    if (locale !== 'cs') {
      try {
        console.warn(`[i18n] Attempting to load Czech fallback messages`)
        const fallbackModule = await import('./locales/cs/common.json')
        messages = fallbackModule.default || fallbackModule
        
        // Validate fallback messages
        if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
          throw new Error('Czech fallback messages are also empty')
        }
        
        locale = 'cs'
        console.log(`[i18n] Successfully loaded ${Object.keys(messages).length} Czech fallback message keys`)
      } catch (fallbackError) {
        console.error('[i18n] Failed to load fallback Czech messages:', fallbackError)
        messages = {} // Last resort: empty messages
        console.error('[i18n] Using empty messages object - translations will not work!')
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

