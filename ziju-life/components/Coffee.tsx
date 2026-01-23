import DecorativeShapes from "./DecorativeShapes";

export default function Coffee() {
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <DecorativeShapes position="right" />
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="relative inline-block">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 400 }}>
            <span className="hand-drawn-underline">Dáme kafe?</span>
          </h2>
          {/* Coffee icon decoration */}
          <span 
            className="absolute -top-4 -right-8 text-4xl opacity-20"
            style={{ transform: 'rotate(15deg)' }}
          >
            ☕
          </span>
        </div>
        
        <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
          Jsem ten typ člověka, který má vždy čas na kávu. Pokud se v tom životě taky trochu motáš, chceš probrat svoje experimenty, nebo jen slyšet jiný úhel pohledu, můžeme dát kávu v Ostravě nebo se spojit online a trochu pokecat o životě.
        </p>
        
        <a
          href="https://www.skool.com/@matej-mauler-3777?g=ziju-life-9405"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-medium hover:bg-accent-hover transition-colors mt-4 shadow-lg hover:shadow-xl"
        >
          Můžeš mi napsat na skoolu →
        </a>
      </div>
    </section>
  );
}
