import DecorativeShapes from "./DecorativeShapes";
import Link from "next/link";

export default function Coffee() {
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <DecorativeShapes position="right" />
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="relative inline-block">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Dáme kávu?</span>
          </h2>
          {/* Coffee icon decoration */}
          <span 
            className="absolute -top-4 -right-8 text-4xl opacity-20"
            style={{ transform: 'rotate(15deg)' }}
          >
            ☕
          </span>
        </div>
        
        <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
          Rád se potkávám s lidmi, kteří se taky snaží dešifrovat tenhle svět. Pokud se chceš jen tak potkat, probrat svoje experimenty nebo prostě pokecat, napiš mi na skoolu nebo kdekoliv jinde a můžem dát online meet. 
          <br /><br />
          Pokud cítíš, že se v něčem motáš v kruhu a chceš jít víc do hloubky, můžeme se domluvit na koučinku.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <a
            href="https://www.skool.com/@matej-mauler-3777?g=ziju-life-9405"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Chci jen tak pokecat (Free)
          </a>
          <Link
            href="/koucing"
            className="btn-playful inline-block px-8 py-4 bg-white border-2 border-accent text-accent rounded-full text-lg font-semibold hover:bg-accent/5 transition-colors shadow-lg hover:shadow-xl"
          >
            Chci jít víc do hloubky (Koučink)
          </Link>
        </div>
      </div>
    </section>
  );
}
