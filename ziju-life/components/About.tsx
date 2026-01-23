export default function About() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center">
          Příběh Reverse-Engineera
        </h2>
        
        <div className="prose prose-lg max-w-none text-foreground/80 space-y-6 leading-relaxed">
          <p className="text-lg md:text-xl">
            Ve 30 jsem vystoupil z kolečka projektového manažera. Došlo mi, že jedna třetina života podle cizích pravidel stačila. Dnes stavím Žiju life na 5 pilířích:
          </p>
          
          <ul className="space-y-4 text-lg md:text-xl list-none pl-0">
            <li className="flex items-start gap-3">
              <span className="text-accent font-bold text-xl">•</span>
              <span><strong>Zvídavost</strong> – Neustále se ptám "proč" a "jak to funguje".</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent font-bold text-xl">•</span>
              <span><strong>Otevřenost</strong> – Sdílím i ty faily, které bych radši schoval.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent font-bold text-xl">•</span>
              <span><strong>Upřímnost</strong> – Žádné korporátní řeči. Jenom real talk.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent font-bold text-xl">•</span>
              <span><strong>Hravost</strong> – Život je experiment. Někdy to vyjde, někdy ne. A to je v pohodě.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent font-bold text-xl">•</span>
              <span><strong>Radost</strong> – Růst může být sranda. Nemusí to být jenom dřina.</span>
            </li>
          </ul>
          
          <p className="text-lg md:text-xl pt-4">
            Jestli tě tohle rezonuje, pojď do komunity. Rád tě poznám.
          </p>
        </div>
        
        <div className="flex justify-center pt-8">
          <a
            href="https://www.skool.com/ziju-life-9405"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-accent text-white rounded-full text-lg font-medium hover:bg-accent-hover transition-colors text-center"
          >
            Připoj se do komunity
          </a>
        </div>
      </div>
    </section>
  );
}
