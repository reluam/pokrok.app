import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'Smyslužití',
  description: 'Projekt zaměřený na smysluplné žití, osobní rozvoj a dosahování cílů',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background via-60% to-playful-yellow-light/30 relative">
          {/* Unified background for entire site */}
          <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-background via-60% to-playful-yellow-light/30 -z-10">
            {/* Animated background blobs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
