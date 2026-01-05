import { Inter, Press_Start_2P } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getThemeInitScript } from '@/lib/color-utils'
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
      signInFallbackRedirectUrl="/planner"
      signUpFallbackRedirectUrl="/planner"
    >
      <html suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: getThemeInitScript(),
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Suppress Speed Insights errors when blocked by content blockers
                (function() {
                  const originalError = console.error;
                  console.error = function(...args) {
                    const message = args[0]?.toString() || '';
                    if (message.includes('speed-insights') || message.includes('_vercel') || message.includes('ERR_BLOCKED_BY_CONTENT_BLOCKER')) {
                      return; // Silently ignore Speed Insights errors
                    }
                    originalError.apply(console, args);
                  };
                })();
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} ${pressStart2P.variable} antialiased`}>
          {children}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}