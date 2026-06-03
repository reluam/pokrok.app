import { Cormorant_Garamond, Inter } from "next/font/google";
import "./journey.css";

const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = { title: "Cesta — Spaghetti.ltd" };

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${serif.variable} ${sans.variable} journey-scope`} style={{ minHeight: "100dvh", background: "#04060f" }}>
      {children}
    </div>
  );
}
