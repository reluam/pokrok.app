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

  // Function to load messages with multiple fallback strategies
  const loadMessages = async (targetLocale: string): Promise<Record<string, any>> => {
    // Strategy 1: Relative path from i18n.ts location
    try {
      const messages = (await import(`./locales/${targetLocale}/common.json`)).default
      if (messages && typeof messages === 'object') {
        return messages
      }
    } catch (error) {
      console.error(`Strategy 1 failed for locale ${targetLocale}:`, error)
    }

    // Strategy 2: Absolute path with @ alias
    try {
      const messages = (await import(`@/locales/${targetLocale}/common.json`)).default
      if (messages && typeof messages === 'object') {
        return messages
      }
    } catch (error) {
      console.error(`Strategy 2 failed for locale ${targetLocale}:`, error)
    }

    // Strategy 3: Direct path resolution (for Vercel/build environments)
    // Try multiple possible paths since Vercel might have different working directory
    try {
      const path = require('path')
      const fs = require('fs')
      
      // Try different possible base paths
      const possiblePaths = [
        path.join(process.cwd(), 'locales', targetLocale, 'common.json'),
        path.join(process.cwd(), 'pokrok-game-web', 'locales', targetLocale, 'common.json'),
        path.join(__dirname, 'locales', targetLocale, 'common.json'),
        path.join(__dirname, '..', 'locales', targetLocale, 'common.json'),
      ]
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const parsed = JSON.parse(fileContent)
          if (parsed && typeof parsed === 'object') {
            return parsed
          }
        }
      }
    } catch (error) {
      console.error(`Strategy 3 failed for locale ${targetLocale}:`, error)
    }

    throw new Error(`All strategies failed for locale ${targetLocale}`)
  }

  try {
    const messages = await loadMessages(locale)
    return {
      locale,
      messages
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}, trying Czech fallback:`, error)
    try {
      // Fallback to Czech
      const fallbackMessages = await loadMessages('cs')
      return {
        locale: 'cs',
        messages: fallbackMessages
      }
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError)
      // Last resort: return minimal messages to prevent complete failure
      return {
        locale: 'cs',
        messages: {
          common: {
            loading: 'Načítání...',
            save: 'Uložit',
            cancel: 'Zrušit'
          }
        }
      }
    }
  }
})

