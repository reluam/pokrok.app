import Link from "next/link";
import { BookOpen, Users, Sparkles } from "lucide-react";

export default function ChooseYourPath() {
  return (
    <section id="choose-your-path" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Jak převzít řízení?
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Každý potřebujeme v danou chvíli něco jiného. Někdo hledá inspiraci, jiný parťáky a někdo hlubokou změnu. Zvol si tempo a intenzitu, která ti teď dává smysl.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Blog */}
          <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 transform">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <BookOpen className="text-accent" size={32} />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
              Inspirace
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-6 text-center">
              Reporty z mé cesty. Jak přemýšlím a co testuju.
            </p>
            <Link
              href="/blog"
              className="btn-playful w-full px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl text-center block"
            >
              Číst články
            </Link>
          </div>

          {/* Card 2: Komunita */}
          <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 transform">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="text-accent" size={32} />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
              Komunita
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-6 text-center">
              Free prostor na Skoolu, kde sdílíme co funguje a co ne.
            </p>
            <a
              href="https://www.skool.com/ziju-life-9405"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-playful w-full px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl text-center block"
            >
              Vstoupit do komunity
            </a>
          </div>

          {/* Card 3: Koučink */}
          <div className="bg-white rounded-2xl p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 transform">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="text-accent" size={32} />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
              Koučink
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-6 text-center">
              Podíváme se pod kapotu tvého autopilota a nastavíme ho tak, aby pracoval pro tebe.
            </p>
            <Link
              href="/koucing"
              className="btn-playful w-full px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl text-center block"
            >
              Chci změnu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
