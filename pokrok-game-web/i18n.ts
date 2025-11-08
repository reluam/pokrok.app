import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './i18n/config'
import path from 'path'
import fs from 'fs'

// Static imports for better webpack bundling on Vercel
import csMessages from './locales/cs/common.json'
import enMessages from './locales/en/common.json'

const messageMap: Record<Locale, typeof csMessages> = {
  cs: csMessages,
  en: enMessages
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  // The middleware handles redirecting to user's preferred locale from database
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'cs' // Default to Czech
  }

  // Strategy 1: Use static imports (best for Vercel/webpack bundling)
  try {
    const messages = messageMap[locale as Locale]
    if (messages && typeof messages === 'object') {
      // Validate that common.loading exists
      if (!messages.common?.loading) {
        console.warn(`[i18n] WARNING: common.loading missing in static import for locale ${locale}`)
        console.warn(`[i18n] Available keys:`, Object.keys(messages))
      }
      console.log(`[i18n] Successfully loaded messages for locale ${locale} using static import`)
      console.log(`[i18n] Message count: ${Object.keys(messages).length}, has common.loading: ${!!messages.common?.loading}`)
      return { locale, messages }
    } else {
      console.warn(`[i18n] Static import returned invalid messages for locale ${locale}:`, typeof messages)
    }
  } catch (error) {
    console.error(`[i18n] Strategy 1 (static import) failed for locale ${locale}:`, error)
  }

  // Strategy 2: Dynamic import (fallback)
  try {
    const messages = (await import(`./locales/${locale}/common.json`)).default
    if (messages && typeof messages === 'object') {
      console.log(`[i18n] Successfully loaded messages for locale ${locale} using dynamic import`)
      return { locale, messages }
    }
  } catch (error) {
    console.error(`[i18n] Strategy 2 (dynamic import) failed for locale ${locale}:`, error)
  }

  // Strategy 3: File system read (for Vercel/production)
  try {
    const filePath = path.join(process.cwd(), 'locales', locale, 'common.json')
    console.log(`[i18n] Trying file system path: ${filePath}, cwd: ${process.cwd()}`)
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const messages = JSON.parse(fileContent)
      if (messages && typeof messages === 'object') {
        console.log(`[i18n] Successfully loaded messages for locale ${locale} using file system`)
        return { locale, messages }
      }
    } else {
      console.warn(`[i18n] File does not exist: ${filePath}`)
    }
  } catch (error) {
    console.error(`[i18n] Strategy 3 (file system) failed for locale ${locale}:`, error)
  }

  // Strategy 4: Try alternative path (for different build environments)
  try {
    const altPath = path.join(process.cwd(), 'pokrok-game-web', 'locales', locale, 'common.json')
    console.log(`[i18n] Trying alternative path: ${altPath}`)
    if (fs.existsSync(altPath)) {
      const fileContent = fs.readFileSync(altPath, 'utf-8')
      const messages = JSON.parse(fileContent)
      if (messages && typeof messages === 'object') {
        console.log(`[i18n] Successfully loaded messages for locale ${locale} using alternative path`)
        return { locale, messages }
      }
    }
  } catch (error) {
    console.error(`[i18n] Strategy 4 (alternative path) failed for locale ${locale}:`, error)
  }

  // Fallback to Czech if other locale fails
  if (locale !== 'cs') {
    console.warn(`[i18n] Failed to load messages for locale ${locale}, falling back to Czech`)
    try {
      const fallbackMessages = messageMap.cs || (await import(`./locales/cs/common.json`)).default
      return {
        locale: 'cs',
        messages: fallbackMessages
      }
    } catch (fallbackError) {
      console.error('[i18n] Failed to load fallback messages:', fallbackError)
    }
  }

  // Last resort: return empty messages to prevent crash
  console.error(`[i18n] All strategies failed for locale ${locale}, returning empty messages`)
  return {
    locale,
    messages: {}
  }
})

