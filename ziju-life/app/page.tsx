import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import ContentGrid from "@/components/ContentGrid";
import Komunita from "@/components/Komunita";
import Coffee from "@/components/Coffee";
import StayInContact from "@/components/StayInContact";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Medailonek />
      <ContentGrid />
      <Komunita />
      <Coffee />
      <StayInContact />
      </main>
  );
}
