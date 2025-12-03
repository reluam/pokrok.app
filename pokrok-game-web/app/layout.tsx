import { Inter, Press_Start_2P } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
  display: 'swap',
})

export const metadata = {
  title: 'Pokrok - Životní plánovač',
  description: 'Pokrok je aplikace pro plnění cílů - od malých po životní sny. Pokrok je navržen tak, aby se přizpůsobil Vašim měnícím se prioritám a měnil se tak spolu s Vámi.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/game"
      signUpFallbackRedirectUrl="/game"
    >
      <html>
        <head>
        </head>
        <body className={`${inter.variable} ${pressStart2P.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}