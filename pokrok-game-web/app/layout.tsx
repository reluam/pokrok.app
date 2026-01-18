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
                // Also safely handle error objects to prevent circular JSON errors
                (function() {
                  const originalError = console.error;
                  console.error = function(...args) {
                    const message = args[0]?.toString() || '';
                    if (message.includes('speed-insights') || message.includes('_vercel') || message.includes('ERR_BLOCKED_BY_CONTENT_BLOCKER')) {
                      return; // Silently ignore Speed Insights errors
                    }
                    // Safely serialize error objects to prevent circular JSON errors
                    const safeArgs = args.map(arg => {
                      // If it's already a string, number, boolean, null, or undefined, use it as-is
                      if (arg === null || arg === undefined || typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
                        return arg;
                      }
                      // If it's an Error object, extract message safely
                      if (arg instanceof Error) {
                        try {
                          return arg.message || 'Error (no message)';
                        } catch (e) {
                          return 'Error (could not extract message)';
                        }
                      }
                      // If it's an object, try to serialize it safely
                      if (arg && typeof arg === 'object') {
                        try {
                          // Test if it can be serialized
                          JSON.stringify(arg);
                          return arg;
                        } catch (e) {
                          // Circular reference detected, return a safe string
                          if (arg.constructor && arg.constructor.name) {
                            return '[Object ' + arg.constructor.name + ' with circular reference]';
                          }
                          return '[Object with circular reference]';
                        }
                      }
                      // For anything else, try to convert to string safely
                      try {
                        return String(arg);
                      } catch (e) {
                        return '[Could not convert to string]';
                      }
                    });
                    originalError.apply(console, safeArgs);
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