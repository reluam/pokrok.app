import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FixCzechTypography from "@/components/FixCzechTypography";
import CookieConsent from "@/components/CookieConsent";

const baloo2 = Baloo_2({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-baloo',
});

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: "Žiju life. Místo, kde se učíme hrát život podle sebe.",
  description: "Život nemá manuál a většina z nás se v něm prostě jen snaží neztratit. Já věřím, že v tom nemusíme být sami. Tvořím komunitu pro všechny, kteří chtějí život opravdu prožít, zkoušet nové věci, získat nadhled a zjistit, o čem je štěstí.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${baloo2.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <FixCzechTypography />
        <Navigation />
        {children}
        <Footer />
        <CookieConsent />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
