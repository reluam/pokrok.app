import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import ManualTeaser from "@/components/ManualTeaser";
import ChooseYourPath from "@/components/ChooseYourPath";
import RevealSection from "@/components/RevealSection";
import PosledniInspirace from "@/components/PosledniInspirace";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <RevealSection triggerOnMount>
        <Medailonek />
      </RevealSection>
      <RevealSection delay={0.08}>
        <ManualTeaser />
      </RevealSection>
      <RevealSection delay={0.12}>
        <ChooseYourPath />
      </RevealSection>
      <RevealSection delay={0.16}>
        <PosledniInspirace />
      </RevealSection>
    </main>
  );
}
