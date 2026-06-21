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

// Clerk modal/UI sladěný se spaghetti vzhledem — krémové pozadí, tenké linky,
// pill tlačítka, Space Grotesk nadpisy, naše logo nahoře.
const clerkAppearance = {
  layout: {
    logoImageUrl: "/logo.svg",
    logoPlacement: "inside" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#1a1614",
    colorText: "#1a1614",
    colorTextSecondary: "#5c5550",
    colorBackground: "#fffdf6",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1614",
    colorDanger: "#b91c1c",
    borderRadius: "0px",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-display)",
    colorTextOnPrimaryBackground: "#FAFAF7",
  },
  elements: {
    card: {
      backgroundColor: "#fffdf6",
      border: "1px solid rgba(26,22,20,0.14)",
      boxShadow: "0 18px 50px -28px rgba(26,22,20,0.5)",
      borderRadius: "0px",
    },
    logoImage: { height: "32px" },
    headerTitle: { fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "-0.02em" },
    headerSubtitle: { color: "#5c5550" },
    socialButtonsBlockButton: {
      backgroundColor: "#ffffff",
      border: "1px solid rgba(26,22,20,0.16)",
      borderRadius: "999px",
      boxShadow: "none",
    },
    socialButtonsBlockButtonText: { fontFamily: "var(--font-sans)", fontWeight: 600, color: "#1a1614" },
    dividerLine: { backgroundColor: "rgba(26,22,20,0.12)" },
    dividerText: { color: "#9b958f" },
    formFieldLabel: { color: "#5c5550", fontFamily: "var(--font-sans)", fontWeight: 600 },
    formFieldInput: {
      backgroundColor: "#ffffff",
      border: "1px solid rgba(26,22,20,0.16)",
      borderRadius: "0px",
      color: "#1a1614",
    },
    formButtonPrimary: {
      backgroundColor: "#1a1614",
      borderRadius: "999px",
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: "14px",
      textTransform: "none",
      boxShadow: "none",
    },
    footerActionText: { color: "#9b958f" },
    footerActionLink: { color: "#1a1614", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" },
    formResendCodeLink: { color: "#1a1614" },
    identityPreviewEditButton: { color: "#1a1614" },
    otpCodeFieldInput: { border: "1px solid rgba(26,22,20,0.16)", borderRadius: "0px" },
  },
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
          <ClerkProvider appearance={clerkAppearance}>{inner}</ClerkProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}
