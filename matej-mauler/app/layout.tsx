import type { Metadata } from "next";
import { Baloo_2, DM_Sans } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});
export const metadata: Metadata = {
  title: "Matěj Mauler | Služby s AI — weby & automatizace",
  description:
    "Tvorba webových stránek a automatizace s využitím umělé inteligence. Moderní weby a chytré procesy na míru.",
  openGraph: {
    title: "Matěj Mauler | Služby s AI",
    description: "Tvorba webů a automatizace s AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className={`${baloo.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] font-[family-name:var(--font-body)] text-[var(--fg)] noise">
        {children}
      </body>
    </html>
  );
}
