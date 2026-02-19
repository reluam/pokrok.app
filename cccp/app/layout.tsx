import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Coach CRM & Client Portal",
  description: "Jednoduché CRM a klientský portál pro koučink"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

