import type { Metadata } from "next";
import TheRules from "@/components/rules/TheRules";

export const metadata: Metadata = {
  title: "the rules — three games where the rules are optional",
  description:
    "every game has rules. every rule was made up by someone. three classic games, each with a hidden way out.",
};

export default function Page() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0a" }}>
      <TheRules />
    </div>
  );
}
