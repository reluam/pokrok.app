// data/audit-zivotaData.ts

export type ResourceType = "Cvičení" | "Šablona" | "Kurz" | "Článek"

export interface Resource {
  label: string
  type: ResourceType
  free: boolean
  href?: string
}

export interface Practice {
  id: string
  icon: string
  title: string
  teaser: string
  description: string
  steps: string[]
  duration?: string
}

export interface Step {
  id: string
  label: string
  color: string
  lightBg: string
  darkBg: string
  title: string
  description: string
  points?: string[]
  practices?: Practice[]
  values?: string[]
  resources: Resource[]
}

export const steps: Step[] = [
  {
    id: "start",
    label: "Start",
    color: "#888780",
    lightBg: "#F1EFE8",
    darkBg: "#444441",
    title: "Kde teď jsi?",
    description:
      "Každá cesta začíná tím, že se upřímně podíváš na svůj život. Ne jak by měl vypadat — ale jak opravdu vypadá. Ohodnoť každou oblast na škále 1–10.",
    points: [
      "Kariéra & práce",
      "Finance",
      "Zdraví & tělo",
      "Rodina & partnerský vztah",
      "Přátelství & sociální život",
      "Osobní rozvoj",
      "Volný čas & záliby",
      "Duchovnost & smysl",
    ],
    practices: [
      {
        id: "kolo-zivota",
        icon: "⭕",
        title: "Kolo života",
        teaser: "Vizuální audit 8 oblastí",
        description:
          "Kolo života je základní diagnostický nástroj, který se v koučinku osvědčuje přes desítky let. Během 15 minut ti dá přehledný obraz o tom, kde jsi dnes — a kde jsou největší mezery.",
        steps: [
          "Nakresli kruh a rozděl ho na 8 výsečí. Každou pojmenuj: kariéra, finance, zdraví, vztahy, přátelství, rozvoj, volný čas, smysl.",
          "Ohodnoť každou oblast 1–10 (1 = zcela nespokojený/á, 10 = naprosto spokojený/á).",
          "Vybarvi každou výseč od středu odpovídajícím počtem dílků. Vznikne ti tvar — málokdy dokonalý kruh.",
          "Podívej se na výsledek: Kde jsou největší díry? Kde jsi překvapivě spokojený/á? Co ti výsledek říká o tvých prioritách?",
        ],
        duration: "15–20 minut",
      },
      {
        id: "appreciative-inquiry",
        icon: "✨",
        title: "Co mi funguje",
        teaser: "Začni tím, co funguje — ne tím, co nefunguje",
        description:
          "Obecně se doporučuje začínat reflexi tím, co funguje — ne tím, co nefunguje. Mozek se lépe mění, když vychází z vlastních silných stránek, ne ze slabostí.",
        steps: [
          "Napiš 3 věci, které ti v životě opravdu fungují — v jakékoliv oblasti.",
          "Ke každé napiš: Proč to funguje? Co jsi udělal/a pro to, aby to tak bylo?",
          "Napiš: Jak bych mohl/a přenést tuto logiku úspěchu do oblasti, kde se trápím?",
          "Přečti si odpovědi nahlas. Co si uvědomuješ?",
        ],
        duration: "10 minut",
      },
      {
        id: "otazka-pritomnosti",
        icon: "🔍",
        title: "Otázka přítomnosti",
        teaser: "Co sis právě uvědomil/a?",
        description:
          "Skutečná změna začíná uvědoměním — ne akčním plánem. Tato jednoduchá otázka zastaví automatické myšlení a otevře prostor pro to, co je skutečně přítomné a důležité.",
        steps: [
          "Sedni si v klidu a zhluboka se 3× nadechni a vydechni.",
          "Polož si otázku: 'Co si uvědomuji, když se upřímně podívám na svůj život právě teď?'",
          "Napiš první myšlenku, která přijde — bez cenzury a hodnocení.",
          "Napiš ještě jednu odpověď. A pak ještě jednu. Třetí odpověď bývá nejhlubší.",
          "Co z toho chceš vzít dál?",
        ],
        duration: "5–10 minut",
      },
    ],
    resources: [
      { label: "Tvoje mapa", type: "Cvičení", free: true, href: "/tvoje-mapa/audit" },
      { label: "Jak najít směr", type: "Článek", free: true, href: "/feed" },
    ],
  },

  {
    id: "hodnoty",
    label: "Hodnoty",
    color: "#7F77DD",
    lightBg: "#EEEDFE",
    darkBg: "#3C3489",
    title: "Co je pro tebe důležité?",
    description:
      "Projdi seznam hodnot a vyber 10, které ti nejvíce rezonují. Z těch 10 vyber 5–7 nejdůležitějších a seřaď je. Hodnoty jsou tvůj kompas — ne pravidla ostatních. Můžeš použít interaktivní aplikaci níže, nebo si vybrat ze seznamu na konci stránky.",
    points: [
      "Rodina · Svoboda · Poctivost · Zdraví · Růst · Tvořivost",
      "Bezpečí · Dobrodružství · Láska · Odvaha · Klid · Disciplína",
      "Nezávislost · Komunita · Jednoduchost · Radost · Smysl",
    ],
    practices: [
      {
        id: "peak-experience",
        icon: "🏔️",
        title: "Nejlepší momenty",
        teaser: "Najdi hodnoty přes zážitky, ne přes seznam",
        description:
          "Hodnoty se neodhalují přemýšlením — odhalují se prožíváním. Vzpomínky na momenty, kdy ses cítil/a nejvíce sám/sama sebou, jsou spolehlivějším zdrojem než jakýkoliv seznam hodnot.",
        steps: [
          "Vzpomeň na 3 momenty ze svého života, kdy ses cítil/a nejvíce živý/á, spokojený/á nebo hrdý/á na sebe.",
          "Ke každému momentu napiš: Kde jsi byl/a? Co jsi dělal/a? S kým?",
          "Hledej společné jmenovatele: Co tyto momenty sdílejí? Co bylo přítomno vždy?",
          "Pojmenuj 3–5 hodnot, které z těchto momentů vyplývají. To jsou tvoje skutečné hodnoty.",
        ],
        duration: "20–30 minut",
      },
      {
        id: "force-ranking",
        icon: "⚖️",
        title: "Nucená volba",
        teaser: "Seřaď hodnoty tlakem výběru",
        description:
          "Velký seznam hodnot je hezký, ale k ničemu. Nucená volba tě nutí skutečně rozhodovat — a teprve v tom výběru se ukazuje, co je pro tebe opravdu nejdůležitější.",
        steps: [
          "Vyber 10 hodnot, které ti nejvíce rezonují ze seznamu.",
          "Porovnávej je po dvou: Kdybys mohl/a mít jen jednu z těchto dvou, kterou bys zachoval/a?",
          "Na základě výsledků porovnání seřaď hodnoty od nejdůležitější po nejméně důležitou.",
          "Podívej se na top 5: Souhlasí pořadí s tím, jak skutečně žiješ? Kde je největší rozdíl?",
        ],
        duration: "15 minut",
      },
      {
        id: "realitni-test",
        icon: "🪞",
        title: "Realitní test",
        teaser: "Kde žiješ v souladu s hodnotami?",
        description:
          "Nestačí vědět, jaké máš hodnoty. Obecně se doporučuje konfrontovat to, co říkáme, že je důležité — s tím, jak skutečně žijeme. Tato mezera je zdrojem nespokojenosti.",
        steps: [
          "Vezmi svých top 5 hodnot a pro každou napiš: 'Jak moc tuto hodnotu žiji dnes, na škále 1–10?'",
          "Kde je skóre nejnižší? Napiš konkrétní příklad ze minulého týdne, kdy jsi tuto hodnotu nenaplnil/a.",
          "Polož si otázku: 'Co by se muselo změnit, abych tuto hodnotu žil/a víc?'",
          "Vyber jednu hodnotu s největší mezerou a napiš jeden konkrétní krok, který uděláš tento týden.",
        ],
        duration: "15–20 minut",
      },
    ],
    values: [
      "Altruismus", "Autenticita", "Činorodost", "Dobrodružství", "Flexibilita",
      "Harmonie", "Humor", "Hravost", "Individualita", "Integrita",
      "Intuice", "Jedinečnost", "Jistota", "Kariéra", "Klid",
      "Komunita", "Kreativita", "Láska", "Loajalita", "Materiální zabezpečení",
      "Mír", "Moudrost", "Nadhled", "Nezávislost", "Odvaha",
      "Otevřenost", "Peníze", "Příroda", "Poctivost", "Pochopení",
      "Pokora", "Postavení", "Pravdivost", "Přátelství",
      "Radost", "Rodina", "Síla", "Sláva", "Spiritualita",
      "Spolehlivost", "Spravedlnost", "Svědomí", "Svoboda", "Štěstí",
      "Tolerance", "Upřímnost", "Úspěch", "Víra", "Volný čas",
      "Vděčnost", "Vyrovnanost", "Vzájemnost", "Vzdělání", "Zdraví",
      "Zvědavost",
    ],
    resources: [
      { label: "Hodnotový kompas", type: "Cvičení", free: true, href: "/tvoje-mapa/hodnoty" },
      { label: "Seznam hodnot", type: "Šablona", free: true, href: "/tvoje-mapa/seznam-hodnot" },
    ],
  },

  {
    id: "vize",
    label: "Vize",
    color: "#378ADD",
    lightBg: "#E6F1FB",
    darkBg: "#0C447C",
    title: "Jak chceš žít za 5 let?",
    description:
      "Popiš svůj ideální den za 5 let a zamysli se nad tím, jaký odkaz chceš zanechat. Pohled z perspektivy 80. narozenin ti pomůže odhalit, co je pro tebe skutečně důležité.",
    points: [
      "Kde žiješ a s kým?",
      "Co děláš profesně — a jak to konkrétně vypadá?",
      "Jak se cítíš v těle, ve vztazích, sám se sebou?",
    ],
    practices: [
      {
        id: "80-narozeniny",
        icon: "🎂",
        title: "80. narozeniny",
        teaser: "Jaký odkaz chceš zanechat?",
        description:
          "Toto cvičení pomáhá odhalit, co je pro člověka skutečně důležité — přes perspektivu konce života. Překoná jakýkoliv seznam hodnot, protože pracuje s tím, co chceš, aby po tobě zbylo.",
        steps: [
          "Představ si, že slavíš 80. narozeniny. V místnosti jsou tvoji nejbližší.",
          "Napiš: Co by o tobě řekl tvůj partner/partnerka nebo nejbližší přítel/kyně?",
          "Napiš: Co by o tobě řekly tvoje děti nebo lidé, které jsi mentoroval/a?",
          "Napiš: Co by o tobě řekli kolegové nebo komunita, které jsi sloužil/a?",
          "Klíčová otázka: Shoduje se to, co jsi napsal/a, s tím, jak žiješ dnes? Kde je největší mezera?",
        ],
        duration: "20–30 minut",
      },
      {
        id: "den-v-zivote",
        icon: "🌅",
        title: "Den v životě",
        teaser: "Zapiš svůj ideální den za 5 let",
        description:
          "Abstraktní vize nefunguje — konkrétní obraz ano. Popis jednoho dne tě nutí být specifický/á a zároveň přirozeně propojíš všechny oblasti života do jednoho celku.",
        steps: [
          "Nastav datum: Píšeš deníkový záznam z roku, který je přesně 5 let od dneška.",
          "Začni od rána: Kde a s kým se probouzíš? Jak se cítíš?",
          "Popiš pracovní část dne: Co děláš, s kým, kde, jak to vypadá?",
          "Popiš odpoledne a večer: Jaké jsou tvoje vztahy, koníčky, rituály?",
          "Napiš celý den v přítomném čase. Minimálně 300 slov. Čím konkrétnější, tím lépe.",
        ],
        duration: "20–30 minut",
      },
      {
        id: "telesna-zkouska",
        icon: "🧘",
        title: "Tělesná zkouška",
        teaser: "Tělo ví, co mozek popírá",
        description:
          "Emoce a tělesné pocity jsou spolehlivějším kompasem než racionální analýza. Mozek může zdůvodnit cokoliv — tělo lže mnohem méně a ukáže, kde je skutečná energie.",
        steps: [
          "Napiš nebo přečti svoji vizi nahlas. Celou, bez přeskakování.",
          "Po každé větě nebo odstavci se zastav a všimni si: Co cítím v těle? Kde?",
          "Zaznamenej si: Kde jsi cítil/a otevření, lehkost nebo vzrušení? (Tam je energie.)",
          "Kde jsi naopak cítil/a stažení, váhavost nebo napětí? (Tam je buď strach, nebo nesoulad.)",
          "Na základě tělesné zpětné vazby uprav vizi: Co chceš posílit? Co vypustit?",
        ],
        duration: "15 minut",
      },
    ],
    resources: [
      { label: "Vizualizace budoucnosti", type: "Cvičení", free: true, href: "/tvoje-mapa/vize" },
      { label: "Průvodce vizí", type: "Článek", free: true, href: "/feed" },
    ],
  },

  {
    id: "oblasti",
    label: "Oblasti",
    color: "#BA7517",
    lightBg: "#FAEEDA",
    darkBg: "#633806",
    title: "Nastav jednotlivé oblasti",
    description:
      "Pro každou z 8 oblastí nastavíš principy, lekce, návyky a metriky. Nejdřív rozhovor — co funguje a co ne. Pak zapisuješ.",
    points: [
      "Principy — podle čeho se v téhle oblasti chceš řídit",
      "Lekce — co ses naučil, co bys udělal jinak",
      "Návyky — co zavádíš nebo odstraňuješ",
      "Metriky — jak poznáš, že to funguje",
    ],
    practices: [
      {
        id: "sokratovske-otazky",
        icon: "💬",
        title: "3 základní otázky",
        teaser: "Co funguje? Co ne? Co chci místo toho?",
        description:
          "Tři jednoduché otázky, které fungují pro libovolnou oblast života. Obecně se doporučuje procházet je v tomto pořadí — od toho, co funguje, přes problém, k řešení.",
        steps: [
          "Vezmi jednu oblast (začni tou, kde je největší mezera z Kola života).",
          "Polož si: 'Co v téhle oblasti opravdu funguje? Co chci zachovat?'",
          "Polož si: 'Co nefunguje nebo mě tíží? Co chci změnit?'",
          "Polož si: 'Co konkrétně chci místo toho? Jak by to vypadalo, kdyby to fungovalo?'",
          "Napiš odpovědi. Pak z nich vyvoď principy, lekce a návyky pro tuto oblast.",
        ],
        duration: "20–30 minut na oblast",
      },
      {
        id: "prace-s-presvedcenimi",
        icon: "🧠",
        title: "Práce s přesvědčeními",
        teaser: "Co blokuje změnu pod povrchem?",
        description:
          "Za každou oblastí, kde se opakovaně nedaří, stojí přesvědčení, které to blokuje. Pokud toto přesvědčení neodhalíme a nezměníme, akční plány nepomůžou.",
        steps: [
          "Vyber oblast, ve které se opakovaně nedaří nebo kde si přestaješ věřit.",
          "Napiš: 'Co si v téhle oblasti o sobě říkám? Jaký příběh si vyprávím?'",
          "Napiš toto přesvědčení jako větu (příklad: 'Nejsem dost dobrý/á na...', 'To pro mě není...')",
          "Polož si: 'Je toto přesvědčení skutečně pravda? Jaké jsou důkazy pro i proti?'",
          "Napiš nové přesvědčení, které by ti umožnilo změnu. Co bys musel/a začít věřit?",
        ],
        duration: "20 minut",
      },
      {
        id: "hloubkovy-ponor",
        icon: "🤿",
        title: "Hloubkový ponor",
        teaser: "Jedna oblast, opravdu do hloubky",
        description:
          "Nejčastější chyba při nastavování oblastí je snaha udělat vše najednou. Obecně se doporučuje věnovat se jedné oblasti dokud není skutečně zpracovaná — hloubka vede k trvalé změně víc než šíře.",
        steps: [
          "Vyber jednu oblast — ideálně tu, kde je největší mezera nebo bolest.",
          "Odpověz na 5 otázek: Co funguje? Co nefunguje? Co chci místo toho? Co si o tom říkám? Co bych řekl/a příteli ve stejné situaci?",
          "Napiš principy: 3–5 vět, podle kterých se chceš v této oblasti řídit.",
          "Napiš lekce: Co ses naučil/a? Co bys udělal/a jinak?",
          "Napiš návyky: 1 zavádím, 1 odstraňuji. A metriku: jak poznám za 3 měsíce, že to funguje?",
        ],
        duration: "45–60 minut na oblast",
      },
    ],
    resources: [
      { label: "Kariérní audit", type: "Cvičení", free: true, href: "/tvoje-mapa/kariera" },
      { label: "Finanční návyky", type: "Cvičení", free: true, href: "/tvoje-mapa/finance" },
      { label: "Ranní rutina", type: "Šablona", free: true, href: "/tvoje-mapa/zdravi" },
      { label: "Vztahový audit", type: "Cvičení", free: false, href: "/tvoje-mapa/vztahy" },
    ],
  },

  {
    id: "akce",
    label: "Akce",
    color: "#D85A30",
    lightBg: "#FAECE7",
    darkBg: "#712B13",
    title: "První kroky",
    description:
      "Manuál bez akce je jen hezká kniha. Teď přicházejí konkrétní kroky — co uděláš tento týden, tento měsíc a co jsou milníky na celý rok.",
    points: [
      "3 kroky na tento týden",
      "4 kroky na tento měsíc",
      "5 milníků na tento rok",
    ],
    practices: [
      {
        id: "implementacni-zamer",
        icon: "🎯",
        title: "Implementační záměr",
        teaser: "Kdy, kde a jak — přesně",
        description:
          "Výzkumy opakovaně ukazují, že záměry ve formátu 'Udělám X, když nastane Y, na místě Z' zvyšují pravděpodobnost splnění výrazně oproti vágním plánům. Konkrétnost rozhoduje.",
        steps: [
          "Vezmi každý svůj akční krok a napiš k němu: Co přesně udělám? (konkrétní akce)",
          "Napiš: Kdy to udělám? (konkrétní den, čas — ne 'brzy' nebo 'příští týden')",
          "Napiš: Kde to udělám? (konkrétní místo)",
          "Volitelně: Co mě může zastavit? Jak to překonám?",
          "Ulož záměry na viditelné místo — kalendář, nástěnka, telefon.",
        ],
        duration: "15 minut",
      },
      {
        id: "nejmensi-krok",
        icon: "👣",
        title: "Nejmenší krok",
        teaser: "Co můžeš udělat ještě dnes?",
        description:
          "Největší překážkou změny je přemýšlení příliš velkými kroky. Záměrně zmenšený první krok překoná prokrastinaci a rozhýbe setrvačnost — a z pohybu se pak rodí pohyb.",
        steps: [
          "Vezmi svůj nejdůležitější cíl nebo záměr.",
          "Polož si: 'Co je nejmenší možný krok, který mě posouvá správným směrem?'",
          "Zmenšuj ho, dokud tě nenapadne odpověď: 'To bych mohl/a udělat hned teď.'",
          "Udělej ho. Teď. Nebo pokud ne teď, pak do 24 hodin.",
          "Po splnění: Jaký je nejmenší další krok?",
        ],
        duration: "5 minut",
      },
      {
        id: "habit-stacking",
        icon: "🔗",
        title: "Habit Stacking",
        teaser: "Přilep nový návyk ke starému",
        description:
          "Obecně se doporučuje nové návyky kotvit ke stávajícímu chování. Tím využíváš existující rutiny jako spouštěče — místo toho, aby nový návyk musel existovat sám o sobě.",
        steps: [
          "Vypiš 5 věcí, které děláš každý den automaticky (káva, čištění zubů, otevření laptopu...).",
          "Vezmi návyk, který chceš zavést. Napiš: 'Po/Před [existující rutina] udělám [nový návyk].'",
          "Příklad: 'Po ranní kávě si 5 minut zapíšu 3 priority dne.'",
          "Začni co nejmenší verzí — 2 minuty jsou lepší než nic.",
          "Sleduj sérii: každý splněný den označ v kalendáři. Cíl je nepřerušit sérii.",
        ],
        duration: "10 minut na nastavení",
      },
    ],
    resources: [
      { label: "Týdenní plánování", type: "Šablona", free: true, href: "/tvoje-mapa/tyden" },
      { label: "Návyková smyčka", type: "Článek", free: true, href: "/feed" },
    ],
  },

  {
    id: "zivot",
    label: "Žiješ to",
    color: "#534AB7",
    lightBg: "#EEEDFE",
    darkBg: "#26215C",
    title: "Žiješ podle sebe",
    description:
      "Není to cíl — je to způsob bytí. Každé čtvrtletí se zastavíš, zkontoluješ a upravíš. Život se mění, manuál s ním.",
    points: [
      "Quarterly check-in — co funguje, co změnit?",
      "Roční review — jak daleko jsi se dostal?",
      "Aktualizuj manuál — je živý dokument",
    ],
    practices: [
      {
        id: "oslav-nejdriv",
        icon: "🎉",
        title: "Oslav nejdřív",
        teaser: "Pokrok před analýzou mezer",
        description:
          "Obecně se doporučuje před analýzou mezer vždy nejdřív pojmenovat pokrok. Mozek se učí z úspěchu, ne ze sebekritiky — a oslava pokroku motivuje k dalšímu pohybu.",
        steps: [
          "Otevři svůj manuál a záznamy z posledního čtvrtletí.",
          "Napiš 5 věcí, které se ti za poslední 3 měsíce povedlo — malé i velké.",
          "Ke každé napiš: Proč je to důležité? Co to o mně říká?",
          "Dovolil/a sis to plně pocítit — nebo jsi hned přešel/la na to, co nefunguje?",
          "Teprve po oslavě pokroků přejdi k analýze: Co chci příště udělat jinak?",
        ],
        duration: "20 minut",
      },
      {
        id: "otazka-posunu",
        icon: "📈",
        title: "Otázka posunu",
        teaser: "Co ses naučil/a o sobě?",
        description:
          "Nestačí dělat — je třeba vědomě zpracovat, co se stalo, co ses naučil/a a kdo jsi v důsledku toho dnes. Reflexe je to, co z akce dělá zkušenost.",
        steps: [
          "Polož si: 'Co se změnilo za poslední 3 měsíce — v okolnostech, v myšlení, v chování?'",
          "Polož si: 'Co ses naučil/a o sobě, co jsi předtím nevěděl/a?'",
          "Polož si: 'Co chceš v příštím čtvrtletí udělat jinak — a proč?'",
          "Napiš odpovědi. Čím konkrétnější, tím užitečnější pro příští review.",
          "Podívej se na svou vizi: Jsi blíž než před 3 měsíci? Co říká tato odpověď?",
        ],
        duration: "20–30 minut",
      },
      {
        id: "revize-manualu",
        icon: "🔄",
        title: "Revize manuálu",
        teaser: "Živý dokument — aktualizuj ho",
        description:
          "Manuál, ke kterému se nevracíš, je jen zápisník. Pravidelná revize zajišťuje, že zůstává relevantní pro to, kým dnes jsi — ne kým jsi byl/a, když jsi ho psal/a.",
        steps: [
          "Přečti svůj manuál celý — od první stránky po poslední.",
          "Pro každou sekci si polož: Je toto stále platné? Odpovídá tomu, kým jsem dnes?",
          "Označ věci, které se změnily nebo přestaly platit. Aktualizuj je.",
          "Přidej nové lekce a poznatky z posledního čtvrtletí.",
          "Nastav datum dalšího check-inu — do 3 měsíců. Vlož ho do kalendáře hned teď.",
        ],
        duration: "45–60 minut",
      },
    ],
    resources: [
      { label: "Quarterly check-in", type: "Šablona", free: true, href: "/tvoje-mapa/checkin" },
      { label: "Roční review", type: "Cvičení", free: false, href: "/tvoje-mapa/review" },
    ],
  },

  {
    id: "export",
    label: "Poznatky",
    color: "#FF8C42",
    lightBg: "#FFF4ED",
    darkBg: "#7C3A10",
    title: "Tvoje poznatky",
    description:
      "Shrnutí toho, co sis v průvodci zapsal/a. Stáhni si svůj dokument a pracuj s ním dál — vrať se k němu, aktualizuj ho a žij podle sebe.",
    resources: [],
  },
]
