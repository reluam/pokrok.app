import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matej Mauler — Pruzkumnik zivotem",
  description:
    "Vedome ziti neni duchovni koncept. Je to prakticka dovednost, ktera meni zpusob, jakym premyslis, rozhodujes se a zijes.",
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
