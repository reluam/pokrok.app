import DecorativeShapes from "@/components/DecorativeShapes";
import Link from "next/link";

export const dynamic = "force-static";

export default function GDPRPage() {
  return (
    <main className="min-h-screen">
      <section className="relative min-h-[40vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden paper-texture">
        <DecorativeShapes variant="hero" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground">
            Cookies & GDPR
          </h1>
        </div>
      </section>

      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Cookies
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              Tento web používá cookies pro zlepšení uživatelského zážitku a analýzu návštěvnosti. 
              Cookies jsou malé textové soubory, které se ukládají do tvého zařízení při návštěvě webu.
            </p>
            
            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-8 mb-4">
              Jaké cookies používáme?
            </h3>
            <ul className="list-disc list-inside space-y-2 text-lg text-foreground/80 leading-relaxed mb-4">
              <li><strong>Nezbytné cookies:</strong> Tyto cookies jsou nutné pro fungování webu a nelze je vypnout.</li>
              <li><strong>Analytické cookies:</strong> Používáme Vercel Analytics a Speed Insights pro analýzu návštěvnosti a výkonu webu.</li>
              <li><strong>Preferenční cookies:</strong> Ukládáme tvůj souhlas s cookies do localStorage.</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-4">
              GDPR a ochrana osobních údajů
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              Respektujeme tvoje soukromí a chráníme tvoje osobní údaje v souladu s Nařízením GDPR.
            </p>

            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-8 mb-4">
              Jaká data shromažďujeme?
            </h3>
            <ul className="list-disc list-inside space-y-2 text-lg text-foreground/80 leading-relaxed mb-4">
              <li><strong>Emailová adresa:</strong> Pokud se přihlásíš k newsletteru, ukládáme pouze tvou emailovou adresu.</li>
              <li><strong>Kontaktní údaje:</strong> Pokud vyplníš kontaktní formulář, ukládáme jméno, email a zprávu.</li>
              <li><strong>Analytická data:</strong> Shromažďujeme anonymní data o návštěvnosti webu pomocí Vercel Analytics.</li>
            </ul>

            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-8 mb-4">
              Jak používáme tvoje data?
            </h3>
            <ul className="list-disc list-inside space-y-2 text-lg text-foreground/80 leading-relaxed mb-4">
              <li>Emailové adresy z newsletteru používáme pouze pro odesílání newsletteru.</li>
              <li>Kontaktní údaje používáme pouze pro odpověď na tvou zprávu.</li>
              <li>Data nikdy neprodáváme ani nepředáváme třetím stranám.</li>
            </ul>

            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-8 mb-4">
              Tvá práva
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              Máš právo:
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg text-foreground/80 leading-relaxed mb-4">
              <li>Na přístup ke svým osobním údajům</li>
              <li>Na opravu nebo výmaz svých osobních údajů</li>
              <li>Na odhlášení z newsletteru kdykoliv</li>
              <li>Na námitku proti zpracování osobních údajů</li>
            </ul>

            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-8 mb-4">
              Odhlášení z newsletteru
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              Pokud už nechceš dostávat emaily, můžeš se kdykoliv odhlásit pomocí{" "}
              <Link href="/unsubscribe" className="text-accent hover:text-accent-hover underline">
                tohoto formuláře
              </Link>
              {" "}nebo kliknutím na odkaz v každém newsletter emailu.
            </p>

            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-8 mb-4">
              Kontakt
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              Pokud máš jakékoliv dotazy ohledně ochrany osobních údajů nebo chceš uplatnit svá práva, 
              napiš mi na{" "}
              <Link href="/kontakt" className="text-accent hover:text-accent-hover underline">
                kontaktní formulář
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
