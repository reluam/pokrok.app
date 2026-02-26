import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import ChooseYourPath from "@/components/ChooseYourPath";
import RevealSection from "@/components/RevealSection";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <RevealSection>
        <Medailonek />
      </RevealSection>
      <RevealSection delay={0.1}>
        <ChooseYourPath />
      </RevealSection>
    </main>
  );
}
