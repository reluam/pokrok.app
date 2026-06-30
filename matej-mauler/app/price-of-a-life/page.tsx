import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import PriceOfALife from "@/components/price-of-a-life/PriceOfALife";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "the price of a life — what a human life is implicitly worth",
  description:
    "Governments price a human life every day — they just don't say it out loud. Make 10 funding decisions and watch your own implicit value of a life take shape.",
};

export default function Page() {
  return (
    <div className={grotesk.variable}>
      <style>{`@keyframes pol-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
      <PriceOfALife />
    </div>
  );
}
