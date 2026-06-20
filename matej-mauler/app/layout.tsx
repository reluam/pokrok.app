import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { ExperiencePanelMount } from "@/components/ExperiencePanelMount";
import "./globals.css";

// Clerk se zapne, jen když jsou v prostředí klíče → web funguje i bez nich (žádný 500 při deployi před setupem).
const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Headline font – Space Grotesk
const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Body font – Inter
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

// Mono font – JetBrains Mono (technické popisky v Manuálu na život atd.)
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// --font-grotesk je alias na --font-display (globals.css) — Space Grotesk se načítá jen jednou

export const metadata: Metadata = {
  metadataBase: new URL("https://www.spaghetti.ltd"),
  title: "Spaghetti.ltd",
  description: "I have bad ideas and plenty of artificial willpower to build them.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const inner = (
    <>
      {children}
      <ExperiencePanelMount />
      <Analytics />
      <SpeedInsights />
    </>
  );

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        {clerkEnabled ? (
          <ClerkProvider
            appearance={{ variables: { colorPrimary: "#1a1614", borderRadius: "12px", fontFamily: "var(--font-sans)" } }}
          >
            {inner}
          </ClerkProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}
