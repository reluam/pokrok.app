import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://calibrate.app'),
  title: {
    default: 'Calibrate — Život potřebuje jiné lekce',
    template: '%s · Calibrate',
  },
  description:
    'Rozhodování, pozornost, peníze, psychologie, zdraví. Denně 5 minut věcí, které opravdu ovlivňují život — a v učebnici je nenajdeš. 175+ konceptů, žádné reklamy, synchronizace napříč zařízeními.',
  applicationName: 'Calibrate',
  keywords: [
    'Calibrate',
    'mentální modely',
    'kognitivní zkreslení',
    'rozhodování',
    'psychologie',
    'kritické myšlení',
    'produktivita',
    'finanční gramotnost',
    'spaced repetition',
    'micro-learning',
    'denní lekce',
    'mental models app',
    'cognitive biases',
  ],
  authors: [{ name: 'Smysluplně žití' }],
  creator: 'Smysluplně žití',
  publisher: 'Smysluplně žití',
  alternates: {
    canonical: '/',
    languages: {
      'cs-CZ': '/',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: 'Calibrate — Život potřebuje jiné lekce',
    description:
      'Denně 5 minut o rozhodování, penězích, psychologii a zdraví. To, co ti opravdu bude každý den k něčemu.',
    url: 'https://calibrate.app',
    siteName: 'Calibrate',
    type: 'website',
    locale: 'cs_CZ',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calibrate — Život potřebuje jiné lekce',
    description:
      'Denně 5 minut o rozhodování, penězích, psychologii a zdraví. To, co ti opravdu bude každý den k něčemu.',
    creator: '@smysluplnoziti',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'education',
  icons: {
    icon: [
      { url: '/mascot.svg', type: 'image/svg+xml' },
      { url: '/mascot-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/mascot-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/mascot-icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FDFDF7',
  width: 'device-width',
  initialScale: 1,
};

// Structured data — helps search engines understand Calibrate as an app.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://calibrate.app/#webapp',
      name: 'Calibrate',
      url: 'https://calibrate.app',
      description:
        'Micro-learning aplikace pro rozhodování, psychologii, produktivitu, peníze, mindfulness a zdraví. Denně 5 minut konceptů, které se ve škole neučí.',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, iOS, Android',
      inLanguage: ['cs', 'en'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CZK',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://calibrate.app/#org',
      name: 'Smysluplně žití',
      url: 'https://calibrate.app',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
