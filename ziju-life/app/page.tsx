import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import KoucingSection from "@/components/KoucingSection";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Medailonek />
      <KoucingSection />
    </main>
  );
}
