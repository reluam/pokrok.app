import Link from "next/link";
import RevealSection from "@/components/RevealSection";

export default function ManualPage() {
  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <RevealSection triggerOnMount>
              <div className="bg-white/90 rounded-[32px] border border-white/60 shadow-md backdrop-blur glass-grain px-6 py-8 md:px-10 md:py-10">
                <div className="space-y-5 md:space-y-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                    Manuál pro život
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                    Jak žít?{" "}
                    <span className="whitespace-nowrap">(Návod k použití člověka)</span>
                  </h1>
                  <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                    Manuál pro přežití v moderní době, který bych si přál dostat k narození.
                  </p>
                  <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                    Dnešní svět je složitý, ale my jsme v jádru pořád stejní lovci a sběrači. Jen jsme
                    džungli vyměnili za open space a stres z predátorů za stres z notifikací. Tato
                    stránka je můj osobní tahák. Je to soubor principů, hodnot a lekcí, které jsem
                    posbíral ze svých vlastních chyb a z příběhů chytřejších lidí. Napsal jsem ho hlavně
                    proto, abych měl sám kompas, podle kterého se chci v životě rozvíjet.
                  </p>
                </div>
              </div>
            </RevealSection>

            {/* Callout / upozornění */}
            <RevealSection delay={0.03} className="mt-6">
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 text-amber-950 px-4 py-4 md:px-6 md:py-5 flex gap-3 items-start shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-lg">
                  <span aria-hidden>⚠️</span>
                  <span className="sr-only">Upozornění</span>
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <span className="font-semibold">Důležité upozornění před čtením:</span>{" "}
                  Tohle není dogma. Je to neúplný a neustále se vyvíjející dokument. Určitě obsahuje
                  věci, ve kterých se mýlím. Jak budu sbírat nová data a zkušenosti z reality, budu
                  tento manuál přepisovat a upravovat. Neber to jako svatý grál, ber to jako inspiraci
                  pro svůj vlastní systém.
                </p>
              </div>
            </RevealSection>

            {/* Sekce 1 */}
            <RevealSection delay={0.06} className="mt-10 md:mt-12">
              <section>
                <header className="space-y-3 md:space-y-4">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                    Sekce 1: Naprostý základ{" "}
                    <span className="text-foreground/60">(Fyziologická mašina)</span>
                  </h2>
                  <p className="text-base md:text-lg text-foreground/80 leading-relaxed max-w-3xl">
                    Mozek není izolovaný od těla – je to jeho součást. Abys mohl řešit složité mentální
                    úkoly, nesmíš ignorovat své fyzické potřeby. Žádný time management tě nezachrání,
                    pokud ignoruješ tyto čtyři základní pilíře.
                  </p>
                </header>

                <div className="mt-7 md:mt-8 space-y-6 md:space-y-7">
                  {/* Spánek */}
                  <article className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
                        <span aria-hidden>🌙</span>
                        <span className="sr-only">Spánek</span>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground">
                          1. Spánek{" "}
                          <span className="text-foreground/60 font-normal">(Aktualizace systému)</span>
                        </h3>
                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                          Osobně jsem nikdy neměl velký problém s usínáním, vstáváním nebo posouváním
                          režimů. Důvod je ten, že jsem pravděpodobně od mala přirozeně dodržoval dobrou
                          spánkovou hygienu. Spánek není luxus, je to naprostý základ.
                        </p>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Tipy
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>Vstávej ideálně každý den ve stejnou dobu.</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>Hodinu před spánkem nepoužívej obrazovky.</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>Poslední kávu (kofein) pij kolem 15:00.</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Zdroje / Kde začít
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li>
                              <a
                                href="https://www.hubermanlab.com/newsletter/improve-your-sleep"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent font-semibold hover:underline"
                              >
                                Andrew Huberman: Nástroje pro lepší spánek
                              </a>
                            </li>
                            <li>
                              Kniha{" "}
                              <a
                                href="https://go.dognet.com/?cid=173&chid=hfEhyNSd&refid=698ee425434f4&url=https%3A%2F%2Fwww.melvil.cz%2Fkniha-proc-spime%2F"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent font-semibold hover:underline"
                              >
                                Proč spíme
                              </a>
                              : Osobně jsem ji nečetl (nepotřeboval jsem to), ale slyšel jsem na ni tolik
                              chvály, že je to pravděpodobně to nejlepší místo, kde začít, pokud se spánkem
                              bojuješ.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Strava */}
                  <article className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
                        <span aria-hidden>🥩</span>
                        <span className="sr-only">Strava</span>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground">
                          2. Strava <span className="text-foreground/60 font-normal">(Palivo)</span>
                        </h3>
                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                          Naše tělo si miliony let zvykalo na určitý způsob stravování. Pak jsme před
                          10&nbsp;000 lety zdomestikovali zvířata (a tím i sebe) a začali pěstovat plodiny
                          pro masy. V posledních 60 letech jsme to dotáhli do absolutního extrému ve formě
                          rafinovaných cukrů. Abychom se o tělo starali dobře, musíme mu dávat správný typ
                          paliva.
                        </p>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Tipy
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                Kompletně odstraň z jídelníčku rafinované cukry (sladkosti, zákusky,
                                limonády...).
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                Sniž celkový příjem sacharidů (méně brambor, rýže, ideálně úplně vypustit
                                pečivo).
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                Zvyš příjem zdravých tuků a zeleniny (tučné ryby, avokádo, ořechy, semínka,
                                brokolice, celer atd.).
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Zdroje / Kde začít
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li>
                              Moje inspirace:{" "}
                              <Link
                                href="/inspirace/1772998750188"
                                className="text-accent font-semibold hover:underline"
                              >
                                Geniální potraviny
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Pohyb */}
                  <article className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
                        <span aria-hidden>🚶‍♂️</span>
                        <span className="sr-only">Pohyb</span>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground">
                          3. Pohyb <span className="text-foreground/60 font-normal">(Čištění hlavy)</span>
                        </h3>
                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                          Jako lovci a sběrači jsme byli většinu dne na nohách. Tak se naše tělo vyvíjelo a
                          na to bylo zvyklé. S domestikací a specializací se pohyb omezil a v posledním
                          století jsme to opět dotáhli do extrému – většinu dne se vůbec nehýbeme. Jsme
                          přikováni k židlím.
                        </p>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Tipy
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>Zahaj den protažením nebo cvičením (jóga je naprosto ideální).</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                V průběhu dne se minimálně každé 2 hodiny (klidně i častěji) na 5 minut
                                projdi.
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>Nachoď za den minimálně 10&nbsp;000 kroků (20&nbsp;000 je ještě lepších).</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Zdroje / Kde začít
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li>
                              Moje inspirace:{" "}
                              <Link
                                href="/inspirace/1772999485170"
                                className="text-accent font-semibold hover:underline"
                              >
                                Čtyřhodinové tělo
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Odpočinek */}
                  <article className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
                        <span aria-hidden>🛑</span>
                        <span className="sr-only">Odpočinek</span>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground">
                          4. Odpočinek{" "}
                          <span className="text-foreground/60 font-normal">(Regenerace)</span>
                        </h3>
                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                          Aby náš mozek i tělo fungovaly optimálně, potřebují dostatek odpočinku. Míra
                          odpočinku závisí na mnoha faktorech (jak moc se hýbeme, jíme a spíme), ale jako
                          naprosté minimum se už od biblických dob doporučuje alespoň jeden celý den v týdnu.
                        </p>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Tipy
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                Vyhraď si jeden den v týdnu, kdy máš absolutní zákaz dělat jakoukoliv práci.
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                V době odpočinku buď v přítomném okamžiku. Nepřemýšlej nad minulostí ani nad
                                budoucností.
                              </span>
                            </li>
                            <li className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30" />
                              <span>
                                Když se cítíš přes den vyčerpaně, dej si 30–60 minut aktivity nesouvisející
                                s prací. Pokud ti chybí energie i poté, pro dnešek už nepracuj.
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                            Zdroje / Kde začít
                          </h4>
                          <ul className="space-y-1.5 text-sm md:text-base text-foreground/80">
                            <li>
                              Kniha{" "}
                              <a
                                href="https://www.knihydobrovsky.cz/kniha/moc-pritomneho-okamziku-5423462"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent font-semibold hover:underline"
                              >
                                Moc přítomného okamžiku
                              </a>
                              : Na první pohled nesouvisející, ale naprosto zásadní kniha pro to, abys vůbec
                              dokázal při odpočinku vypnout hlavu.
                            </li>
                            <li>
                              Kniha{" "}
                              <a
                                href="https://go.dognet.com/?cid=173&chid=hfEhyNSd&refid=698ee425434f4&url=https%3A%2F%2Fwww.melvil.cz%2Fkniha-stastnejsi%2F"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent font-semibold hover:underline"
                              >
                                Šťastnější
                              </a>
                              : Pokud ti dělá problém si vůbec vyhradit čas na odpočinek a důležité věci,
                              Cassie Holmes ti v tomhle pomůže.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </RevealSection>

            {/* Sekce 2 – Technologie */}
            <RevealSection delay={0.09} className="mt-10 md:mt-14">
              <section className="relative overflow-hidden rounded-[28px] border border-dashed border-foreground/15 bg-white/70 px-6 py-8 md:px-8 md:py-10 text-foreground/55">
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_55%)]" />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    <span>Coming soon</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground/80">
                    Sekce 2: Technologie. Dobří sluhové, ale zlí páni.
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed">
                    (Jak nastavit technologie tak, aby ti pomáhaly žít lepší život – a ne ti nenápadně
                    sežraly pozornost, vztahy i mozek. Sociální sítě, notifikace, emaily i AI...
                    Připravuji.)
                  </p>
                </div>
              </section>
            </RevealSection>

            {/* Sekce 3 – Co se ve škole neučí */}
            <RevealSection delay={0.12} className="mt-6 md:mt-8">
              <section className="relative overflow-hidden rounded-[28px] border border-dashed border-foreground/15 bg-white/70 px-6 py-8 md:px-8 md:py-10 text-foreground/55">
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_55%)]" />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    <span>Coming soon</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground/80">
                    Sekce 3: Co se ve škole neučí
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed">
                    (Základy bychom měli. Když už nám funguje tělo, je čas podívat se na pravidla hry, o
                    kterých nám ve škole zapomněli říct. Peníze, rozhodování, vztahy a práce s vlastní
                    myslí... Připravuji.)
                  </p>
                </div>
              </section>
            </RevealSection>
          </div>
        </div>
      </section>
    </main>
  );
}

