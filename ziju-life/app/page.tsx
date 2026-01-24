import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import Philosophy from "@/components/Philosophy";
import Coffee from "@/components/Coffee";
import ContentGrid from "@/components/ContentGrid";
import StayInContact from "@/components/StayInContact";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Medailonek />
      <Philosophy />
      <Coffee />
      <ContentGrid />
      <StayInContact />
      </main>
  );
}
