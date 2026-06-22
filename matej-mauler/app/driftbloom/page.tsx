import type { Metadata } from "next";
import Driftbloom from "@/components/driftbloom/Driftbloom";

export const metadata: Metadata = {
  title: "driftbloom — evolution has no goal",
  description: "an evolution sim: selection fits the local environment, not a destination.",
};

export default function Page() {
  return <Driftbloom />;
}
