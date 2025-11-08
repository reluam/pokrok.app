import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'

// Static imports for all locales - ensures they're included in the build
import csMessages from '@/locales/cs/common.json'
import enMessages from '@/locales/en/common.json'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Note: generateStaticParams is removed to force dynamic rendering
// This is necessary because pages require user authentication and cannot be statically generated

// Map of locale to messages for quick lookup
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

  // Providing all messages to the client
  // Try static import first (most reliable for Vercel), then fallback to getMessages
  let messages: typeof csMessages = messagesMap[locale]
  
  if (!messages) {
    // Fallback to getMessages if static import didn't work
    try {
      const getMessagesResult = await getMessages({ locale })
      messages = getMessagesResult as typeof csMessages
    } catch (getMessagesError) {
      console.error(`getMessages failed for locale ${locale}:`, getMessagesError)
      // Last resort: use Czech messages
      messages = csMessages
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

