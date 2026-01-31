import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import ChooseYourPath from "@/components/ChooseYourPath";
import StayInContact from "@/components/StayInContact";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ChooseYourPath />
      <Medailonek />
      <StayInContact />
    </main>
  );
}
