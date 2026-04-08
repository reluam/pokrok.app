import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matěj Mauler — Human Performance Laboratory",
  description:
    "Průzkumník životem. Kouč pro ty, kteří chtějí překonat své biologické i mentální limity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
