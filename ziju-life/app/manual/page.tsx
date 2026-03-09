import Link from "next/link";
import RevealSection from "@/components/RevealSection";

export default function ManualPage() {
  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <RevealSection triggerOnMount>
              <div className="bg-white/90 rounded-[32px] border border-white/60 shadow-md backdrop-blur glass-grain px-6 py-8 md:px-10 md:py-10">
                <div className="space-y-5 md:space-y-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                    Manuál pro život
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                    Jak žít?{" "}
                    <span className="whitespace-nowrap">(Manuál pro žití)</span>
                  </h1>
                  <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                    Manuál pro žití v moderní době, který bych si přál dostat k narození.
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

            <div className="mt-10 md:mt-12 lg:mt-14 grid gap-8 lg:gap-10 md:grid-cols-12 items-start">
              {/* Levé menu – obsah manuálu */}
              <aside className="hidden md:block md:col-span-3 sticky top-28 lg:top-32">
                <div className="rounded-3xl border border-white/60 bg-white/80 shadow-md backdrop-blur-xl backdrop-saturate-150 glass-grain p-4 lg:p-5">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                      Obsah
                    </div>
                    <div className="text-[11px] font-semibold text-foreground/40">
                      Jak žít?
                    </div>
                  </div>

                  <nav className="mt-4 space-y-5 text-sm">
                    <div className="space-y-2">
                      <a
                        href="#sekce-1-zaklad"
                        className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-foreground/80 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                      >
                        <span>Sekce 1: Základ těla</span>
                        <span className="text-foreground/40 group-hover:text-foreground/70 transition-colors" aria-hidden>
                          →
                        </span>
                      </a>
                      <ul className="space-y-1">
                        {[
                          { href: "#spanek", label: "1. Spánek" },
                          { href: "#strava", label: "2. Strava" },
                          { href: "#pohyb", label: "3. Pohyb" },
                          { href: "#odpocinek", label: "4. Odpočinek" },
                        ].map((item) => (
                          <li key={item.href}>
                            <a
                              href={item.href}
                              className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-foreground/70 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-foreground/25 group-hover:bg-accent/70 transition-colors" />
                              <span className="leading-snug">{item.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <a
                        href="#sekce-2-principy"
                        className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-foreground/80 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                      >
                        <span>Sekce 2: Principy pro život</span>
                        <span className="text-foreground/40 group-hover:text-foreground/70 transition-colors" aria-hidden>
                          →
                        </span>
                      </a>
                      <ul className="space-y-1">
                        {[
                          { href: "#co-se-ve-skole-neuci", label: "Co se ve škole neučí?" },
                          { href: "#zodpovednost-za-zivot", label: "Zodpovědnost za život" },
                          { href: "#skoro-nic-neni-cernobile", label: "Nic není černobílé" },
                          { href: "#smysl-kazdodenni-kroky", label: "Smysl = každodenní kroky" },
                          { href: "#sebevedomi-tezke-veci", label: "Sebevědomí a těžké věci" },
                          { href: "#hotove-lepsi-nez-dokonale", label: "Hotové > dokonalé" },
                          { href: "#intuice", label: "Intuice" },
                        ].map((item) => (
                          <li key={item.href}>
                            <a
                              href={item.href}
                              className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-foreground/70 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-foreground/25 group-hover:bg-accent/70 transition-colors" />
                              <span className="leading-snug">{item.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <a
                        href="#sekce-3-technologie"
                        className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-foreground/80 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                      >
                        <span>Sekce 3: Technologie</span>
                        <span className="text-foreground/40 group-hover:text-foreground/70 transition-colors" aria-hidden>
                          →
                        </span>
                      </a>
                      <ul className="space-y-1">
                        <li>
                          <a
                            href="#sekce-3-technologie"
                            className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-foreground/70 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-foreground/25 group-hover:bg-accent/70 transition-colors" />
                            <span className="leading-snug">Dobří sluhové, zlí páni</span>
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <a
                        href="#sekce-4-pilulky"
                        className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-foreground/80 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                      >
                        <span>Sekce 4: Hořké pilulky</span>
                        <span className="text-foreground/40 group-hover:text-foreground/70 transition-colors" aria-hidden>
                          →
                        </span>
                      </a>
                      <ul className="space-y-1">
                        <li>
                          <a
                            href="#sekce-4-pilulky"
                            className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-foreground/70 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-foreground/25 group-hover:bg-accent/70 transition-colors" />
                            <span className="leading-snug">Pilulky hořké jako pelyněk</span>
                          </a>
                        </li>
                        {[
                          { href: "#pilulka-mozek-hloupejsi", label: "Mozek je hloupější" },
                          { href: "#pilulka-neber-se-vazne", label: "Neber se tak vážně" },
                          { href: "#pilulka-neber-svet-vazne", label: "Neber svět tak vážně" },
                          { href: "#pilulka-jsme-zvirata", label: "Jsme pořád zvířata" },
                          { href: "#pilulka-neni-jedna-vec", label: "Neexistuje jeden zázrak" },
                        ].map((item) => (
                          <li key={item.href}>
                            <a
                              href={item.href}
                              className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-foreground/70 hover:text-foreground transition-colors hover:bg-black/[0.04]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-foreground/25 group-hover:bg-accent/70 transition-colors" />
                              <span className="leading-snug">{item.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </nav>
                </div>
              </aside>

              <div className="md:col-span-9 space-y-10">
            {/* Sekce 1 */}
            <RevealSection delay={0.06}>
              <section id="sekce-1-zaklad">
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
                  <article
                    id="spanek"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4"
                  >
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
                  <article
                    id="strava"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4"
                  >
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
                  <article
                    id="pohyb"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4"
                  >
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
                  <article
                    id="odpocinek"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 flex flex-col gap-4"
                  >
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

            {/* Sekce 2 – Principy pro život */}
            <RevealSection delay={0.09} className="mt-10 md:mt-12">
              <section id="sekce-2-principy">
                <header className="space-y-3 md:space-y-4">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                    Sekce 2: Principy pro život
                  </h2>
                  <p className="text-base md:text-lg text-foreground/80 leading-relaxed max-w-3xl">
                    Jak o sobě a světě přemýšlíš, určuje, jaké kroky děláš. Tohle jsou principy, které mi
                    dlouhodobě pomáhají držet kurz – i když se okolnosti mění.
                  </p>
                </header>

                <div className="mt-7 md:mt-8 space-y-6 md:space-y-7">
                  {/* Co se ve škole neučí? */}
                  <article
                    id="co-se-ve-skole-neuci"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Co se ve škole neučí?
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Ve škole tě většinou připravovali na testy, ne na hru jménem život. Neučili tě, jak
                      zacházet s penězi, emocemi, vlastní energií ani vztahy.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Většinu důležitých dovedností se učíš až za pochodu – v práci, ve vztazích, v
                        krizi. Je to náročné, ale má to jednu výhodu: můžeš si nastavit vlastní pravidla
                        hry místo těch, která ti někdo nadiktoval.
                      </p>
                      <p>
                        Čím dřív přijmeš, že „školní hru“ máš dávno za sebou a teď hraješ tu vlastní, tím
                        snáz si dovolíš hledat lepší systém pro sebe – ne pro vysvědčení.
                      </p>
                    </div>
                  </article>

                  {/* Za svůj život jsi zodpovědný pouze ty sám. */}
                  <article
                    id="zodpovednost-za-zivot"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Za svůj život jsi zodpovědný pouze ty sám.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Nikdo jiný nemůže žít tvůj život za tebe. V určitém bodě si prostě musíš říct:
                      „Je to na mně.“
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Můžeš mít podporu, kouče, partnera, komunitu. Ale rozhodnutí, které děláš každé
                        ráno, večer i mezi tím, za tebe nikdo neudělá. V určitém bodě si prostě musíš
                        přiznat: <em>„Je to na mně.“</em>
                      </p>
                      <p>
                        To není tlak, ale svoboda. Jakmile to přijmeš, můžeš s vlastním životem mnohem víc
                        experimentovat.
                      </p>
                    </div>
                  </article>

                  {/* Skoro nic není pouze černobílé. */}
                  <article
                    id="skoro-nic-neni-cernobile"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Skoro nic není pouze černobílé.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžeš
                      nastavit vlastní pravidla.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Buď stabilita, nebo zážitky.
                        Tenhle způsob přemýšlení tě často zbytečně zamyká.
                      </p>
                      <p>
                        Mezi černou a bílou je spousta odstínů. A právě tam si můžeš začít skládat život
                        podle sebe – ne podle škatulek ostatních.
                      </p>
                    </div>
                  </article>

                  {/* Svůj životní smysl tvoříš každodenními kroky a rozhodnutími. */}
                  <article
                    id="smysl-kazdodenni-kroky"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Svůj životní smysl tvoříš každodenními kroky a rozhodnutími.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Smysl nepřijde shora jako jeden velký „aha moment“. Vzniká z malých voleb, které
                      děláš dnes a zítra.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Často čekáme na jeden zlomový okamžik, který nám „vysvětlí život“. V praxi ale
                        smysl vzniká z drobných rozhodnutí – čemu říkáš ano, čemu ne, kam dáváš energii a
                        pozornost.
                      </p>
                      <p>
                        Můžeš začít maličkostmi: jedním projektem, jedním návykem, jedním rozhovorem,
                        který už dlouho odkládáš.
                      </p>
                    </div>
                  </article>

                  {/* Opravdové sebevědomí si vybuduješ děláním těžkých věcí. */}
                  <article
                    id="sebevedomi-tezke-veci"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Opravdové sebevědomí si vybuduješ děláním těžkých věcí.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Sebevědomí není afirmace v zrcadle, ale důkaz. Přichází, když děláš kroky, do
                      kterých se ti nechce – a ustojíš je.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Můžeš si opakovat, že na to máš. Ale dokud si to neověříš v reálném světě, hlava
                        tomu stejně úplně nevěří.
                      </p>
                      <p>
                        Každý malý „těžký krok“, který zvládneš – nepříjemný hovor, odmítnutí, nový projekt
                        – je malý důkaz pro tvé sebevědomí: <em>„Zvládl jsem to. Dám i další věc.“</em>
                      </p>
                    </div>
                  </article>

                  {/* Hotové je lepší než dokonalé. */}
                  <article
                    id="hotove-lepsi-nez-dokonale"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Hotové je lepší než dokonalé.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Perfekcionismus je často jen chytře maskovaný strach. Dokončené věci mění život, ne
                      ty rozdělané.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Můžeš měsíce ladit detaily webu, projektu nebo newsletteru – ale dokud to
                        nepublikuješ, realita ti nedá žádnou zpětnou vazbu. Zůstaneš v bezpečí vlastní
                        hlavy.
                      </p>
                      <p>
                        Když místo dokonalosti začneš cílit na „dost dobré na odeslání“, posuneš se
                        násobně rychleji. Učíš se z reálných reakcí, ne z hypotetických scénářů.
                      </p>
                    </div>
                  </article>

                  {/* Intuice pracuje ve tvůj prospěch. */}
                  <article
                    id="intuice"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Intuice pracuje ve tvůj prospěch.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Intuice není magie. Je to zhuštěná zkušenost tvého mozku, která se ozývá dřív, než
                      ji stihneš rozumově vysvětlit.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Když máš z člověka, spolupráce nebo rozhodnutí „divný pocit“, často v pozadí běží
                        spousta drobných signálů, které tvůj mozek dávno viděl – jen je neumíš hned pojmenovat.
                      </p>
                      <p>
                        Intuici se vyplatí brát vážně, ale ne slepě. Můžeš ji použít jako první kompas a
                        pak ji doplnit rozumem a daty: „Co přesně na téhle situaci mi nesedí?“
                      </p>
                    </div>
                  </article>
                </div>
              </section>
            </RevealSection>

            {/* Sekce 3 – Technologie */}
            <RevealSection delay={0.12} className="mt-10 md:mt-14">
              <section
                id="sekce-3-technologie"
                className="relative overflow-hidden rounded-[28px] border border-dashed border-foreground/15 bg-white/70 px-6 py-8 md:px-8 md:py-10 text-foreground/55"
              >
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_55%)]" />
                <div className="relative space-y-4 text-foreground/80">
                  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    <span>Coming soon</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground/80">
                    Sekce 3: Technologie. Dobří sluhové, ale zlí páni.
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed">
                    (Jak nastavit technologie tak, aby ti pomáhaly žít lepší život – a ne ti nenápadně
                    sežraly pozornost, vztahy i mozek. Sociální sítě, notifikace, emaily i AI...
                    Připravuji.)
                  </p>
                </div>
              </section>
            </RevealSection>

            {/* Sekce 4 – Pilulky hořké jako pelyněk */}
            <RevealSection delay={0.15} className="mt-10 md:mt-12">
              <section id="sekce-4-pilulky">
                <header className="space-y-3 md:space-y-4">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                    Sekce 4: Pilulky hořké jako pelyněk
                  </h2>
                  <p className="text-base md:text-lg text-foreground/80 leading-relaxed max-w-3xl">
                    Některé věci se neříkají snadno, ale je lepší je slyšet včas. Tohle jsou pilulky hořké
                    jako pelyněk – ale pokud je přijmeš, může se ti s vlastním životem mnohem líp pracovat.
                  </p>
                </header>

                <div className="mt-7 md:mt-8 space-y-6 md:space-y-7">
                  <article
                    id="pilulka-mozek-hloupejsi"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Tvůj mozek je hloupější, než si myslíš.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Většinu času jedeš na autopilota – zkratky, emoce a příběhy v hlavě často vyhrávají nad
                      realitou.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Mozek není nástroj na „pravdu“. Je to nástroj na přežití. A přežití často znamená:
                        šetřit energii, držet se známého, vyhýbat se riziku a mít pravdu za každou cenu.
                      </p>
                      <p>
                        Když s tím začneš počítat, přestaneš se divit vlastním přešlapům. A místo sebemrskání
                        začneš stavět prostředí a systémy, které s autopilotem umí pracovat.
                      </p>
                    </div>
                  </article>

                  <article
                    id="pilulka-neber-se-vazne"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">Neber se tak vážně.</h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Ego miluje drama. Humor a lehkost ti vrátí nadhled – a často i odvahu.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Když bereš všechno smrtelně vážně, každá chyba je katastrofa a každý pohled ostatních
                        soud. Tím si zbytečně přidáváš tlak a paradoxně se pak hůř hýbeš.
                      </p>
                      <p>
                        Lehkovážnost není nezodpovědnost. Je to schopnost udržet si odstup: „Tohle jsem udělal
                        špatně. Neznamená to, že jsem špatný.“
                      </p>
                    </div>
                  </article>

                  <article
                    id="pilulka-neber-svet-vazne"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      A neber svět okolo tak vážně.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Spousta „pravidel“ je jen společenská hra. Když to uvidíš, přestaneš se bát pohybu.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Lidé často působí sebejistě, ale uvnitř řeší podobné věci jako ty: nejistotu,
                        porovnávání, strach z odmítnutí. Svět není tak pevný a soudný, jak se tváří.
                      </p>
                      <p>
                        Když přestaneš čekat „povolení“, začneš tvořit. A zjistíš, že většina bariér byla jen v
                        hlavě.
                      </p>
                    </div>
                  </article>

                  <article
                    id="pilulka-jsme-zvirata"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Pod povrchem jsme stále jen zvířata.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      V úplném základu jsme biologické mašiny. Často si myslíme, že „jsme nad tím“, ale nejsme.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Nálada, motivace i schopnost se ovládat nejsou jen „síla vůle“. Jsou to hormony, spánek,
                        jídlo, pohyb, stres a prostředí. Proto sekce 1 není „self-care“, ale infrastruktura.
                      </p>
                      <p>
                        Když tohle přijmeš, přestaneš moralizovat svoje výkyvy a začneš je řídit jako systém. Ne
                        jako charakterovou vadu.
                      </p>
                    </div>
                  </article>

                  <article
                    id="pilulka-neni-jedna-vec"
                    className="bg-white/90 rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all backdrop-blur glass-grain px-5 py-6 md:px-6 md:py-7 space-y-3"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Neexistuje žádná jedna věc, která zázračně vyřeší tvůj život.
                    </h3>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                      Žádný „hack“ to za tebe neodžije. Funguje jen kombinace malých kroků v čase.
                    </p>
                    <div className="space-y-2 text-sm md:text-base text-foreground/80 leading-relaxed">
                      <p>
                        Je lákavé věřit, že existuje jeden kurz, jedna kniha nebo jedna metoda, která všechno
                        přepne. Realita je střízlivější – a zároveň mnohem víc pod tvojí kontrolou.
                      </p>
                      <p>
                        Když přestaneš hledat zázrak a začneš skládat systém (spánek, jídlo, pohyb, vztahy,
                        práce, pozornost), život se začne zlepšovat bez magie.
                      </p>
                    </div>
                  </article>
                </div>
              </section>
            </RevealSection>
              </div>
            </div>
        </div>
      </div>
      </section>
    </main>
  );
}

