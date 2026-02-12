import Hero from "@/components/Hero";
import Medailonek from "@/components/Medailonek";
import ChooseYourPath from "@/components/ChooseYourPath";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Medailonek />
      <ChooseYourPath />
    </main>
  );
}
