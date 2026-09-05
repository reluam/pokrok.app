import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Press_Start_2P, Oswald, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { ExperiencePanelMount } from "@/components/ExperiencePanelMount";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { ACCOUNTS_ENABLED } from "@/lib/features";
import { getLang } from "@/lib/getLang";
import "./globals.css";

// Clerk potřebuje klíče v prostředí i zapnuté účty (lib/features.ts). Účty jsou
// teď schované, takže se ClerkProvider nemountuje vůbec — a nic pod ním nesmí
// volat Clerk hooky.
const clerkEnabled = ACCOUNTS_ENABLED && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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

// Fonty jednotlivých experiencí. Bydlí tady, ne na jejich stránkách, protože
// ExperiencePanel se mountuje v layoutu — je to sourozenec {children}, takže
// proměnné nastavené na <div> uvnitř stránky nevidí. preload: false → @font-face
// platí globálně, ale nepřednačítá se tam, kde není potřeba.
const press = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-press", display: "swap", preload: false });
const oswald = Oswald({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--msw-display", display: "swap", preload: false });
const plexSans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--msw-sans", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--msw-mono", display: "swap", preload: false });

// --font-grotesk je alias na --font-display (globals.css) — Space Grotesk se načítá jen jednou

// Kanonická doména je zase spaghetti.ltd; osobní rozcestník žije pod „/matej",
// takže se i jeho relativní canonicaly řeší proti téhle base.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.spaghetti.ltd"),
  title: "Spaghetti.ltd",
  description: "I have bad ideas and plenty of artificial willpower to build them.",
  icons: { icon: "/logo.svg" },
};

// Clerk modal/UI sladěný se spaghetti vzhledem: jeden podklad (#FAFAF7) jako web,
// všechno hranaté (radius 0 jako karty), tenké linky, Space Grotesk nadpisy, naše logo.
// Schválně minimum override — zbytek řídí variables, ať to nemá divné barvy.
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
    colorNeutral: "#1a1614",
    colorBackground: "#FAFAF7",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1614",
    colorDanger: "#b91c1c",
    borderRadius: "0px",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-display)",
    colorTextOnPrimaryBackground: "#FAFAF7",
  },
  elements: {
    card: { border: "1px solid rgba(26,22,20,0.14)", boxShadow: "0 12px 40px -24px rgba(26,22,20,0.35)" },
    headerTitle: { fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "-0.02em" },
    socialButtonsBlockButton: { backgroundColor: "#ffffff", border: "1px solid rgba(26,22,20,0.16)", boxShadow: "none" },
    formFieldInput: { backgroundColor: "#ffffff", border: "1px solid rgba(26,22,20,0.16)" },
    formButtonPrimary: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "14px", textTransform: "none", boxShadow: "none" },
    footerActionLink: { color: "#1a1614", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const inner = (
    <PostHogProvider>
      {children}
      <ExperiencePanelMount lang={lang} />
      <Analytics />
      <SpeedInsights />
    </PostHogProvider>
  );

  return (
    <html lang={lang} className={`${display.variable} ${sans.variable} ${mono.variable} ${press.variable} ${oswald.variable} ${plexSans.variable} ${plexMono.variable} h-full`}>
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
