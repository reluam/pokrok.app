import type { NodeDef, Bilingual, Satellite } from "./types";

/* ── The Absurd Encyclopedia ────────────────────────────────────────
   Hesla z absurdních fikčních světů, psaná smrtelně vážně — jako by
   to všechno byla skutečnost. Žiješ ve světě poskládaném z těch
   nejabsurdnějších; tady je jeho slovník. Každý svět = hub (up: brana)
   + jeho nejslavnější pojmy (up: hub). Stopařův průvodce žije zvlášť
   v plain-nodes (je to jeden ze světů). */

const sat = (to: string, x = 50, y = 30, label?: Bilingual): Satellite => ({ to, x, y, ...(label ? { label } : {}) });

export const ABSURD_NODES: NodeDef[] = [
  /* ═══ Futurama ═══ */
  {
    slug: "futurama", realm: "futurama", up: "brana", next: "bender", plain: { glyph: "🚀" },
    title: { cs: "Futurama", en: "Futurama" },
    guide: {
      cs: "Země roku 3000. Funguje překvapivě podobně jako ta dnešní — jen s mluvícími roboty, hlavami slavných lidí ve sklenicích a doručovací službou, která přežívá hlavně proto, že na ní nikomu nezáleží.",
      en: "Earth in the year 3000. Works surprisingly like today's — just with talking robots, the heads of famous people in jars, and a delivery company that survives mostly because nobody cares about it.",
    },
    satellites: [sat("bender", 14, 30), sat("slurm", 86, 30), sat("hypnotoad", 86, 70)],
  },
  {
    slug: "bender", realm: "futurama", up: "futurama", next: "slurm", plain: { glyph: "🤖" },
    title: { cs: "Bender", en: "Bender" },
    guide: {
      cs: "Ohýbací robot, který pije, kouří, krade a uráží — a přesto je to nejlepší kamarád, jakého můžeš mít. Pohání ho alkohol; bez piva se mu vybíjí baterie. Bite my shiny metal ass.",
      en: "A bending robot who drinks, smokes, steals and insults — and is somehow the best friend you could have. He runs on alcohol; without booze his battery dies. Bite my shiny metal ass.",
    },
    satellites: [sat("kryten", 14, 70, { cs: "Další robot s problémy", en: "Another robot with issues" })],
  },
  {
    slug: "slurm", realm: "futurama", up: "bender", next: "planet-express", plain: { glyph: "🥤" },
    title: { cs: "Slurm", en: "Slurm" },
    guide: {
      cs: "Nejoblíbenější nápoj 31. století. Vysoce návykový. Vyrábí se na planetě Wormulon a o jeho přesném původu je rozhodně lepší nepřemýšlet.",
      en: "The most popular drink of the 31st century. Highly addictive. Made on planet Wormulon, and it's decidedly better not to think about exactly where it comes from.",
    },
    satellites: [sat("duff", 86, 70, { cs: "Návykové pití jinde", en: "Addictive drink elsewhere" })],
  },
  {
    slug: "planet-express", realm: "futurama", up: "slurm", plain: { glyph: "📦" },
    title: { cs: "Planet Express", en: "Planet Express" },
    guide: {
      cs: "Mezigalaktická doručovací firma. Přežívá díky tomu, že posádka je postradatelná a pojištění levné. Dobrá zpráva, lidi!",
      en: "An intergalactic delivery company. It survives because the crew is expendable and the insurance is cheap. Good news, everyone!",
    },
  },
  {
    slug: "hypnotoad", realm: "futurama", up: "futurama", plain: { glyph: "🐸" },
    title: { cs: "Hypnožába", en: "Hypnotoad" },
    guide: {
      cs: "ALL GLORY TO THE HYPNOTOAD. Nejsledovanější pořad budoucnosti je jen ropucha, která na tebe zírá. Nemáš na výběr. Líbí se ti to. ALL GLORY TO THE HYPNOTOAD.",
      en: "ALL GLORY TO THE HYPNOTOAD. The most-watched show of the future is just a toad staring at you. You have no choice. You're enjoying it. ALL GLORY TO THE HYPNOTOAD.",
    },
  },

  /* ═══ Simpsonovi ═══ */
  {
    slug: "springfield", realm: "simpsons", up: "brana", next: "duff", plain: { glyph: "🏠" },
    title: { cs: "Springfield", en: "Springfield" },
    guide: {
      cs: "Americké městečko, jehož stát nikdo nezná. Má jadernou elektrárnu vedenou maximálně nekompetentně, věčně se nepoučující populaci a nejslavnější žlutou rodinu na světě.",
      en: "An American town whose state nobody can name. It has a nuclear plant run with maximum incompetence, a population that never learns, and the most famous yellow family in the world.",
    },
    satellites: [sat("duff", 14, 30), sat("doh", 86, 30), sat("kwik-e-mart", 86, 70)],
  },
  {
    slug: "duff", realm: "simpsons", up: "springfield", next: "kwik-e-mart", plain: { glyph: "🍺" },
    title: { cs: "Duff", en: "Duff Beer" },
    guide: {
      cs: "Pivo, které pije celý Springfield. Duff, Duff Lite i Duff Dry tečou z jedné a té samé trubky. Maskot Duffman nikdy neumírá — jen se vymění herec. Oh yeah!",
      en: "The beer the whole of Springfield drinks. Duff, Duff Lite and Duff Dry all pour from the same single pipe. The mascot Duffman never dies — they just swap the actor. Oh yeah!",
    },
  },
  {
    slug: "kwik-e-mart", realm: "simpsons", up: "duff", next: "doh", plain: { glyph: "🏪" },
    title: { cs: "Kwik-E-Mart", en: "The Kwik-E-Mart" },
    guide: {
      cs: "Večerka, kde všechno stojí o trochu víc a trvanlivost je spíš návrh. Provozuje ji Apu — má vysokoškolský titul, osmerčata a fotografickou paměť na to, kdy jsi naposledy nic nekoupil. Thank you, come again.",
      en: "A convenience store where everything costs a bit more and the expiry date is more of a suggestion. Run by Apu — who has a PhD, octuplets, and a photographic memory of the last time you bought nothing. Thank you, come again.",
    },
  },
  {
    slug: "doh", realm: "simpsons", up: "kwik-e-mart", plain: { glyph: "😣" },
    title: { cs: "D'oh", en: "D'oh" },
    guide: {
      cs: "Zvuk, který člověk vydá přesně ve chvíli, kdy si uvědomí vlastní hloupost. Slovník ho oficiálně uznává. Homer ho používá jako interpunkci.",
      en: "The sound a person makes at the exact moment they realize their own stupidity. The dictionary officially recognizes it. Homer uses it as punctuation.",
    },
  },

  /* ═══ Red Dwarf ═══ */
  {
    slug: "red-dwarf", realm: "reddwarf", up: "brana", next: "cat", plain: { glyph: "🛰️" },
    title: { cs: "Červený trpaslík", en: "Red Dwarf" },
    guide: {
      cs: "Těžební vesmírná loď velká jako město. Celá posádka zemřela na únik radiace; přežil jen Dave Lister, protože byl v hibernaci za trest — propašoval na palubu těhotnou kočku. O tři miliony let později se probudil.",
      en: "A mining spaceship the size of a city. The entire crew died in a radiation leak; only Dave Lister survived, because he was in suspended animation as punishment for smuggling a pregnant cat aboard. Three million years later, he woke up.",
    },
    satellites: [sat("cat", 14, 30), sat("kryten", 86, 30), sat("smeg", 86, 70)],
  },
  {
    slug: "cat", realm: "reddwarf", up: "red-dwarf", next: "kryten", plain: { glyph: "🐱" },
    title: { cs: "Kocour", en: "The Cat" },
    guide: {
      cs: "Humanoid, který se za tři miliony let vyvinul z Listerovy kočky. Marnivý, sobecký a perfektně oblečený. Má jedinou životní filozofii: vypadat dobře a najít si holku.",
      en: "A humanoid evolved over three million years from Lister's cat. Vain, selfish and impeccably dressed. He has one philosophy in life: look good and find a mate.",
    },
  },
  {
    slug: "kryten", realm: "reddwarf", up: "cat", next: "smeg", plain: { glyph: "🤖" },
    title: { cs: "Kryten", en: "Kryten" },
    guide: {
      cs: "Servisní mechanoid posedlý úklidem a vinou. Naučil se lhát, což pro androida považuje za obrovský osobní úspěch. Existuje, aby sloužil — a aby drhnul.",
      en: "A service mechanoid obsessed with cleaning and guilt. He has learned to lie, which for an android he considers a huge personal achievement. He exists to serve — and to scrub.",
    },
    satellites: [sat("bender", 14, 70, { cs: "Robot opačné povahy", en: "A robot of opposite temperament" })],
  },
  {
    slug: "smeg", realm: "reddwarf", up: "kryten", plain: { glyph: "💢" },
    title: { cs: "Smeg", en: "Smeg" },
    guide: {
      cs: "Nadávka, kterou nikdo nedokáže přesně přeložit — a právě proto funguje na úplně všechno. Smeghead je ten, kdo ji slyší nejčastěji.",
      en: "A swear word nobody can quite translate — which is exactly why it works on absolutely everything. A smeghead is the one who hears it most often.",
    },
  },

  /* ═══ South Park ═══ */
  {
    slug: "south-park", realm: "southpark", up: "brana", next: "they-killed-kenny", plain: { glyph: "⛄" },
    title: { cs: "South Park", en: "South Park" },
    guide: {
      cs: "Tiché horské městečko v Coloradu, kde se každý týden stane apokalypsa — a do dalšího dílu si na ni nikdo nevzpomene. Nejstabilnější nestabilní místo na světě.",
      en: "A quiet mountain town in Colorado where an apocalypse happens every single week — and by the next episode nobody remembers it. The most stable unstable place on Earth.",
    },
    satellites: [sat("they-killed-kenny", 14, 30), sat("member-berries", 86, 30), sat("towelie", 86, 70)],
  },
  {
    slug: "they-killed-kenny", realm: "southpark", up: "south-park", next: "member-berries", plain: { glyph: "🧣" },
    title: { cs: "Zabili Kennyho", en: "They Killed Kenny" },
    guide: {
      cs: "Kenny umírá skoro v každém díle nějakým absurdně brutálním způsobem. Příští týden je zase tady a nikdo to nekomentuje. „Oh my God, they killed Kenny! — You bastards!“",
      en: "Kenny dies in almost every episode in some absurdly gruesome way. Next week he's back and nobody mentions it. “Oh my God, they killed Kenny! — You bastards!”",
    },
  },
  {
    slug: "member-berries", realm: "southpark", up: "they-killed-kenny", next: "towelie", plain: { glyph: "🫐" },
    title: { cs: "Member Berries", en: "Member Berries" },
    guide: {
      cs: "Fialové bobule, které ti šeptají vzpomínky na to, jak bylo dřív líp. „'Member Chewbacca? 'Member?“ Vysoce návykové a po čase nenápadně politicky nebezpečné.",
      en: "Purple berries that whisper memories of how things used to be better. “'Member Chewbacca? 'Member?” Highly addictive and, after a while, quietly politically dangerous.",
    },
  },
  {
    slug: "towelie", realm: "southpark", up: "member-berries", plain: { glyph: "🧖" },
    title: { cs: "Towelie", en: "Towelie" },
    guide: {
      cs: "Ručník s umělou inteligencí a drogovým problémem. Nejhorší superhrdina vůbec. Vždycky ti připomene to nejdůležitější: „Nezapomeň si vzít ručník.“",
      en: "A towel with artificial intelligence and a drug problem. The worst superhero ever. He always reminds you of the most important thing: “Don't forget to bring a towel.”",
    },
    satellites: [sat("rucnik", 50, 80, { cs: "Ten správný ručník", en: "The proper towel" })],
  },

  /* ═══ The Office ═══ */
  {
    slug: "dunder-mifflin", realm: "office", up: "brana", next: "thats-what-she-said", plain: { glyph: "📄" },
    title: { cs: "Dunder Mifflin", en: "Dunder Mifflin" },
    guide: {
      cs: "Pobočka firmy na papír ve Scrantonu v Pensylvánii. Prodává něco, co už skoro nikdo nepotřebuje, a přesto se odtud nedá odejít. Někdo to celé natáčí jako dokument. Nikdo neví proč ani pro koho.",
      en: "A paper company branch in Scranton, Pennsylvania. It sells something almost nobody needs anymore, and yet you can never leave. Someone is filming it all as a documentary. Nobody knows why, or for whom.",
    },
    satellites: [sat("thats-what-she-said", 14, 30), sat("schrute-farms", 86, 30), sat("worlds-best-boss", 86, 70)],
  },
  {
    slug: "thats-what-she-said", realm: "office", up: "dunder-mifflin", next: "schrute-farms", plain: { glyph: "😏" },
    title: { cs: "That's what she said", en: "That's What She Said" },
    guide: {
      cs: "Vtip, který se dá vložit téměř za jakoukoliv větu a okamžitě ji zničí. Michael Scott ho považuje za vrchol světového humoru a nedokáže si ho odpustit.",
      en: "A joke you can append to almost any sentence to instantly destroy it. Michael Scott considers it the pinnacle of world comedy and cannot help himself.",
    },
  },
  {
    slug: "schrute-farms", realm: "office", up: "thats-what-she-said", next: "worlds-best-boss", plain: { glyph: "🌱" },
    title: { cs: "Schrute Farms", en: "Schrute Farms" },
    guide: {
      cs: "Penzion a řepná farma s recenzemi na cestovních webech. Tři druhy pokojů: Hrozba, Strach a Noční můra. Provozuje Dwight, který tě rád probudí ve tři ráno na sklizeň.",
      en: "A bed & breakfast and beet farm with reviews on travel sites. Three room types: Threat, Fear and Nightmare. Run by Dwight, who is happy to wake you at 3 a.m. for the harvest.",
    },
  },
  {
    slug: "worlds-best-boss", realm: "office", up: "schrute-farms", plain: { glyph: "☕" },
    title: { cs: "Nejlepší šéf na světě", en: "World's Best Boss" },
    guide: {
      cs: "Hrnek s nápisem WORLD'S BEST BOSS, který si Michael Scott koupil sám sobě. Z internetu. Nezvratný důkaz, že tituly si můžeš udělit i sám.",
      en: "A mug reading WORLD'S BEST BOSS that Michael Scott bought for himself. Off the internet. Undeniable proof that you can award yourself any title.",
    },
  },

  /* ═══ Top Gear ═══ */
  {
    slug: "top-gear", realm: "topgear", up: "brana", next: "the-stig", plain: { glyph: "🏎️" },
    title: { cs: "Top Gear", en: "Top Gear" },
    guide: {
      cs: "Svět, ve kterém tři dospělí muži ničí auta, staví nemožné stroje a dokazují, že každý problém jde vyřešit větším motorem. Realita je vždycky o krok pozadu.",
      en: "A world where three grown men destroy cars, build impossible machines, and prove that any problem can be solved with a bigger engine. Reality is always one step behind.",
    },
    satellites: [sat("the-stig", 14, 30), sat("reasonably-priced-car", 86, 30), sat("caravan", 86, 70)],
  },
  {
    slug: "the-stig", realm: "topgear", up: "top-gear", next: "reasonably-priced-car", plain: { glyph: "🏁" },
    title: { cs: "The Stig", en: "The Stig" },
    guide: {
      cs: "Tichý závodník v bílé kombinéze. Nikdo nikdy neviděl jeho tvář. Někteří říkají, že má všechny zuby jedné velikosti. Někteří říkají, že se bojí kachen. Víme jen, že se mu říká Stig.",
      en: "A silent racing driver in a white suit. No one has ever seen his face. Some say all his teeth are the same size. Some say he's afraid of ducks. All we know is, he's called the Stig.",
    },
  },
  {
    slug: "reasonably-priced-car", realm: "topgear", up: "the-stig", next: "caravan", plain: { glyph: "🚗" },
    title: { cs: "Rozumně drahé auto", en: "The Reasonably Priced Car" },
    guide: {
      cs: "Obyčejné auto, ve kterém slavní hosté jezdí na čas po mokré trati. Demokratizace ponížení — i hvězda vypadá v zatáčce stejně směšně jako kdokoliv jiný.",
      en: "An ordinary car in which famous guests set lap times around a wet track. The democratization of humiliation — even a star looks just as ridiculous through a corner as anyone else.",
    },
  },
  {
    slug: "caravan", realm: "topgear", up: "reasonably-priced-car", plain: { glyph: "🚐" },
    title: { cs: "Obytný přívěs", en: "The Caravan" },
    guide: {
      cs: "V univerzu Top Gearu nejnenáviděnější objekt na planetě. Existuje primárně proto, aby mohl být rozdrcen, potopen nebo zapálen — ideálně všechno najednou.",
      en: "In the Top Gear universe, the most hated object on the planet. It exists primarily so that it can be crushed, sunk or set on fire — ideally all at once.",
    },
  },

  /* ═══ Rick and Morty ═══ */
  {
    slug: "rick-and-morty", realm: "rickmorty", up: "brana", next: "plumbus", plain: { glyph: "🛸" },
    title: { cs: "Rick and Morty", en: "Rick and Morty" },
    guide: {
      cs: "Geniální alkoholický vědec vláčí svého úzkostného vnuka napříč nekonečnem vesmírů. V některém z nich je vždycky líp — a v některém vždycky hůř. Wubba lubba dub dub.",
      en: "A genius alcoholic scientist drags his anxious grandson across an infinity of universes. In some of them it's always better — and in some always worse. Wubba lubba dub dub.",
    },
    satellites: [sat("plumbus", 14, 30), sat("mr-meeseeks", 86, 30), sat("pickle-rick", 86, 70)],
  },
  {
    slug: "plumbus", realm: "rickmorty", up: "rick-and-morty", next: "mr-meeseeks", plain: { glyph: "🔴" },
    title: { cs: "Plumbus", en: "Plumbus" },
    guide: {
      cs: "Předmět, který má každý doma a každý ví, k čemu je — takže to nikdo nevysvětluje. Výroba začíná dlonkem, ten se ořeže, namočí do škvarklu a je hotovo. Jednoduché.",
      en: "An object everyone has at home and everyone knows what it's for — so nobody explains it. You start with a dinglebop, smooth it out with schleem, and that's it. Simple.",
    },
  },
  {
    slug: "mr-meeseeks", realm: "rickmorty", up: "plumbus", next: "pickle-rick", plain: { glyph: "🔵" },
    title: { cs: "Mr. Meeseeks", en: "Mr. Meeseeks" },
    guide: {
      cs: "Modrá bytost, kterou přivoláš stiskem tlačítka. Splní jeden úkol a pak s obrovskou úlevou přestane existovat. Existence je pro něj bolest. „I'm Mr. Meeseeks, look at me!“",
      en: "A blue being you summon with the press of a button. It completes one task and then, with enormous relief, ceases to exist. Existence is pain for a Meeseeks. “I'm Mr. Meeseeks, look at me!”",
    },
  },
  {
    slug: "pickle-rick", realm: "rickmorty", up: "mr-meeseeks", plain: { glyph: "🥒" },
    title: { cs: "Pickle Rick", en: "Pickle Rick" },
    guide: {
      cs: "Vědec, který se proměnil v okurku, jen aby nemusel jít na rodinnou terapii. Nejúžasnější věc, jakou kdy udělal — podle něj. „I'm Pickle Riiick!“",
      en: "A scientist who turned himself into a pickle purely to get out of family therapy. The most amazing thing he's ever done — according to him. “I'm Pickle Riiick!”",
    },
  },
];
