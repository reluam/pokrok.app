import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Note: generateStaticParams is removed to force dynamic rendering
// This is necessary because pages require user authentication and cannot be statically generated

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
  // side is the easiest way to get started
  // Try direct import first, then fallback to getMessages
  let messages
  try {
    // Strategy 1: Direct import (most reliable)
    messages = (await import(`@/locales/${locale}/common.json`)).default
  } catch (directError) {
    console.error(`Direct import failed for locale ${locale}, trying getMessages:`, directError)
    try {
      // Strategy 2: Use getMessages (uses i18n.ts config)
      messages = await getMessages({ locale })
    } catch (getMessagesError) {
      console.error(`getMessages failed for locale ${locale}:`, getMessagesError)
      // Strategy 3: Fallback to Czech
      try {
        messages = (await import(`@/locales/cs/common.json`)).default
      } catch (fallbackError) {
        console.error('All message loading strategies failed:', fallbackError)
        // Last resort: empty messages
        messages = {}
      }
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

