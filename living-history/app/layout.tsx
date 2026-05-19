import type { Metadata } from "next";
import { Playfair_Display, Crimson_Text } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Changing World Order — Big Cycle",
  description:
    "An interactive study of the rise and fall of world powers, based on Ray Dalio's framework for understanding the Big Cycle of history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${crimson.variable} h-full`}
      style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
