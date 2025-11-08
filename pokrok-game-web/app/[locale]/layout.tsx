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

  // Load messages with error handling and fallback
  let messages
  try {
    messages = await getMessages({ locale })
    
    // Validate that messages were loaded successfully
    if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
      console.error(`[layout] Messages are empty for locale: ${locale}`)
      // Try to load Czech as fallback
      if (locale !== 'cs') {
        try {
          messages = await getMessages({ locale: 'cs' })
          console.warn(`[layout] Using Czech fallback messages for locale: ${locale}`)
        } catch (fallbackError) {
          console.error('[layout] Failed to load fallback Czech messages:', fallbackError)
          messages = {} // Last resort: empty messages
        }
      } else {
        messages = {} // Last resort: empty messages
      }
    }
  } catch (error) {
    console.error(`[layout] Failed to load messages for locale ${locale}:`, error)
    // Try to load Czech as fallback
    if (locale !== 'cs') {
      try {
        messages = await getMessages({ locale: 'cs' })
        console.warn(`[layout] Using Czech fallback messages for locale: ${locale}`)
      } catch (fallbackError) {
        console.error('[layout] Failed to load fallback Czech messages:', fallbackError)
        messages = {} // Last resort: empty messages
      }
    } else {
      messages = {} // Last resort: empty messages
    }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

