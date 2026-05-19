import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matěj Mauler",
  description:
    "Zakladatel Žiju.life. Píšu o vědomém životě, pozornosti a o tom, jak stavět věci, které mají smysl.",
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
