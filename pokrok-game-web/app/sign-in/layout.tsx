import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { locales } from '@/i18n/config'

export default async function SignInLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Use default locale (cs) for root sign-in pages
  const locale = 'cs'
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

