import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'

// Static imports for all locales - ensures they're included in the build
// This is the most reliable way for Vercel deployment
import csMessages from '@/locales/cs/common.json'
import enMessages from '@/locales/en/common.json'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Note: generateStaticParams is removed to force dynamic rendering
// This is necessary because pages require user authentication and cannot be statically generated

// Map of locale to messages for quick lookup
// Using static imports ensures Next.js includes these files in the build
const messagesMap: Record<string, typeof csMessages> = {
  cs: csMessages,
  en: enMessages,
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Use static imports only - no getMessages to avoid i18n.ts issues on Vercel
  const messages = messagesMap[locale] || csMessages

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

