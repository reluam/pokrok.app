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

  return {
    locale,
    messages: (await import(`./locales/${locale}/common.json`)).default
  }
})

