import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './i18n/config'
import path from 'path'
import fs from 'fs'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  // The middleware handles redirecting to user's preferred locale from database
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'cs' // Default to Czech
  }

  // Try multiple strategies to load messages
  let messages: any = null

  // Strategy 1: Dynamic import (works in most cases)
  try {
    messages = (await import(`./locales/${locale}/common.json`)).default
    if (messages && typeof messages === 'object') {
      return { locale, messages }
    }
  } catch (error) {
    console.error(`Strategy 1 (dynamic import) failed for locale ${locale}:`, error)
  }

  // Strategy 2: File system read (for Vercel/production)
  try {
    const filePath = path.join(process.cwd(), 'locales', locale, 'common.json')
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      messages = JSON.parse(fileContent)
      if (messages && typeof messages === 'object') {
        return { locale, messages }
      }
    }
  } catch (error) {
    console.error(`Strategy 2 (file system) failed for locale ${locale}:`, error)
  }

  // Strategy 3: Try alternative path (for different build environments)
  try {
    const altPath = path.join(process.cwd(), 'pokrok-game-web', 'locales', locale, 'common.json')
    if (fs.existsSync(altPath)) {
      const fileContent = fs.readFileSync(altPath, 'utf-8')
      messages = JSON.parse(fileContent)
      if (messages && typeof messages === 'object') {
        return { locale, messages }
      }
    }
  } catch (error) {
    console.error(`Strategy 3 (alternative path) failed for locale ${locale}:`, error)
  }

  // Fallback to Czech if other locale fails
  if (locale !== 'cs') {
    console.warn(`Failed to load messages for locale ${locale}, falling back to Czech`)
    try {
      const fallbackMessages = (await import(`./locales/cs/common.json`)).default
      return {
        locale: 'cs',
        messages: fallbackMessages
      }
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError)
    }
  }

  // Last resort: return empty messages to prevent crash
  console.error(`All strategies failed for locale ${locale}`)
  return {
    locale,
    messages: {}
  }
})

