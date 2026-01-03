// Shared i18n configuration that can be used in both server and client components
export const locales = ['cs', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'cs' // Czech as default, but will detect from browser

