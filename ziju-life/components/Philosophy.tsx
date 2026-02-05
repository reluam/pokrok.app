export default function Philosophy() {
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
          <span className="hand-drawn-underline">Nejsi na to sám</span> (a je to větší sranda).
        </h2>
        
        <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
          Žiju life je playground pro všechny, kteří chtějí růst a zároveň se u toho bavit. V naší free komunitě na Skoolu najdeš lidi na stejné vlně, společné výzvy, praktické materiály a prostor, kde je upřímnost víc než dokonalost a hravost předčí vážnost.
        </p>
        
        <a
          href="https://www.skool.com/zijem-life-3529"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors mt-4 shadow-lg hover:shadow-xl"
        >
          Vstoupit do free komunity na Skoolu
        </a>
      </div>
    </section>
  );
}
