import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matěj Mauler",
  description:
    "Ahoj, jsem Matěj. Tvořím Žiju.life, píšu na Substack a snažím se přijít na to, jak žít vědoměji. Tady najdeš všechno, co dělám.",
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
