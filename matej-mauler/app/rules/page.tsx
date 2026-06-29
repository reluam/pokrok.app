import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import TheRules from "@/components/rules/TheRules";

const press = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press",
  display: "swap",
});

export const metadata: Metadata = {
  title: "the rules — three games where the rules are optional",
  description:
    "every game has rules. every rule was made up by someone. three classic games, each with a hidden way out.",
};

export default function Page() {
  return (
    <div className={press.variable} style={{ minHeight: "100dvh", background: "#0a0a0a" }}>
      <TheRules />
    </div>
  );
}
