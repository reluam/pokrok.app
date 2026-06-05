import type { Lang } from "./dictionaries";

export type Scenario = {
  id: string;
  emoji: string;
  question: { cs: string; en: string };
  odds: string;          // e.g. "1 : 700 000"
  oneIn: number;         // for the "context" line
  explanation: { cs: string; en: string };
};

const allScenarios: Scenario[] = [
  {
    id: "meteor",
    emoji: "☄️",
    question: { cs: "Že tě dnes trefí meteorit", en: "That a meteor hits you today" },
    odds: "1 : 700 000 000 000",
    oneIn: 700_000_000_000,
    explanation: {
      cs: "Šance, že tě zasáhne meteorit, je nižší než výhra v loterii dvakrát po sobě. Vesmír na tebe necílí. Pravděpodobně.",
      en: "The chance a meteor hits you is lower than winning the lottery twice in a row. The universe isn't aiming at you. Probably.",
    },
  },
  {
    id: "sameBirthday",
    emoji: "🎂",
    question: { cs: "Že má někdo ve výtahu stejné narozeniny jako ty", en: "That someone in the elevator shares your birthday" },
    odds: "1 : 137",
    oneIn: 137,
    explanation: {
      cs: "Při pěti lidech ve výtahu je to pořád nepravděpodobné. Ale ne tak nepravděpodobné, jak by sis myslel. Narozeninový paradox je zákeřný.",
      en: "With five people in an elevator it's still unlikely. But not as unlikely as you'd think. The birthday paradox is sneaky.",
    },
  },
  {
    id: "deepDream",
    emoji: "🦑",
    question: { cs: "Že se ti dnes v noci bude zdát o chobotnici", en: "That you'll dream of an octopus tonight" },
    odds: "1 : 12 400",
    oneIn: 12_400,
    explanation: {
      cs: "Pokud o tom teď přemýšlíš, pravděpodobnost právě stoupla. Tím, že čteš tuto větu, sabotuješ výpočet.",
      en: "If you're thinking about it now, the probability just went up. By reading this sentence, you're sabotaging the calculation.",
    },
  },
  {
    id: "toastButter",
    emoji: "🍞",
    question: { cs: "Že toust spadne namazanou stranou dolů", en: "That toast lands butter-side down" },
    odds: "1 : 1,6",
    oneIn: 1.6,
    explanation: {
      cs: "Fyzika je proti tobě. Výška běžného stolu dává toustu přesně tolik času na půl otáčky. Murphy měl pravdu.",
      en: "Physics is against you. A normal table's height gives toast exactly enough time for half a rotation. Murphy was right.",
    },
  },
  {
    id: "alienToday",
    emoji: "👽",
    question: { cs: "Že dnes potkáš mimozemšťana", en: "That you'll meet an alien today" },
    odds: "1 : 8 000 000 000",
    oneIn: 8_000_000_000,
    explanation: {
      cs: "Statisticky vzato je pravděpodobnější, že mimozemšťan už mezi námi je a jen čeká, až přestaneš počítat pravděpodobnosti.",
      en: "Statistically, it's more likely an alien is already among us, just waiting for you to stop calculating probabilities.",
    },
  },
  {
    id: "phoneRing",
    emoji: "📞",
    question: { cs: "Že ti zazvoní telefon přesně když si pomyslíš na toho člověka", en: "That your phone rings exactly when you think of that person" },
    odds: "1 : 320",
    oneIn: 320,
    explanation: {
      cs: "Pamatuješ si jen ty případy, kdy to vyšlo. Tisíckrát to nevyšlo a ty sis toho nevšiml. Mozek je špatný statistik.",
      en: "You only remember the times it worked. It failed a thousand times and you didn't notice. The brain is a bad statistician.",
    },
  },
  {
    id: "lightning",
    emoji: "⚡",
    question: { cs: "Že tě za život zasáhne blesk", en: "That you'll be struck by lightning in your life" },
    odds: "1 : 15 300",
    oneIn: 15_300,
    explanation: {
      cs: "Vyšší, než bys čekal. Roy Sullivan byl zasažen sedmkrát a přežil. Buď nejšťastnější, nebo nejnešťastnější člověk v historii.",
      en: "Higher than you'd expect. Roy Sullivan was struck seven times and survived. Either the luckiest or unluckiest person in history.",
    },
  },
  {
    id: "perfectParking",
    emoji: "🅿️",
    question: { cs: "Že najdeš ideální parkovací místo hned napoprvé", en: "That you find the perfect parking spot on the first try" },
    odds: "1 : 47",
    oneIn: 47,
    explanation: {
      cs: "A když ho najdeš, nikdo to neuvidí. Vesmír odměňuje parkovací zázraky pouze tehdy, když jsi sám.",
      en: "And when you find it, nobody will see it. The universe rewards parking miracles only when you're alone.",
    },
  },
  {
    id: "lottery",
    emoji: "🎰",
    question: { cs: "Že vyhraješ jackpot v loterii", en: "That you win the lottery jackpot" },
    odds: "1 : 292 200 000",
    oneIn: 292_200_000,
    explanation: {
      cs: "Je pravděpodobnější, že tě cestou pro los třikrát zasáhne blesk. Přesto si ten lístek koupíš. A to je krásné.",
      en: "You're more likely to be struck by lightning three times on the way to buy the ticket. Yet you'll buy it anyway. And that's beautiful.",
    },
  },
  {
    id: "shark",
    emoji: "🦈",
    question: { cs: "Že tě napadne žralok", en: "That you'll be attacked by a shark" },
    odds: "1 : 3 700 000",
    oneIn: 3_700_000,
    explanation: {
      cs: "Statisticky tě ohrožuje víc selfie tyč než žralok. Žraloci o tebe nestojí, ty jsi pro ně jen nedorozumění.",
      en: "Statistically, a selfie stick threatens you more than a shark. Sharks aren't interested in you — you're just a misunderstanding to them.",
    },
  },
  {
    id: "planeCrash",
    emoji: "✈️",
    question: { cs: "Že tvoje letadlo spadne", en: "That your plane crashes" },
    odds: "1 : 11 000 000",
    oneIn: 11_000_000,
    explanation: {
      cs: "Nejnebezpečnější část letu je cesta autem na letiště. Ale toho se nebojíš, protože mozek je iracionální.",
      en: "The most dangerous part of flying is the drive to the airport. But you don't fear that, because the brain is irrational.",
    },
  },
  {
    id: "royalFlush",
    emoji: "🃏",
    question: { cs: "Že dostaneš royal flush v pokeru", en: "That you're dealt a royal flush in poker" },
    odds: "1 : 649 740",
    oneIn: 649_740,
    explanation: {
      cs: "A přesně v tu chvíli budeš mít složené karty. Zákon maximálního zklamání je neúprosný.",
      en: "And at exactly that moment you'll have folded. The law of maximum disappointment is relentless.",
    },
  },
  {
    id: "holeInOne",
    emoji: "⛳",
    question: { cs: "Že amatér dá hole-in-one", en: "That an amateur scores a hole-in-one" },
    odds: "1 : 12 500",
    oneIn: 12_500,
    explanation: {
      cs: "Tradice velí, že pak musíš koupit pití celému klubu. Šťastná rána, drahý účet.",
      en: "Tradition says you then have to buy drinks for the whole club. Lucky shot, expensive bill.",
    },
  },
  {
    id: "fourLeafClover",
    emoji: "🍀",
    question: { cs: "Že utrhneš čtyřlístek napoprvé", en: "That you find a four-leaf clover on the first pick" },
    odds: "1 : 5 000",
    oneIn: 5_000,
    explanation: {
      cs: "Mutace, která dělá čtvrtý lístek, je vzácná. Ironií je, že hledání štěstí je samo o sobě dřina.",
      en: "The mutation that makes the fourth leaf is rare. Ironically, searching for luck is itself hard work.",
    },
  },
  {
    id: "snakeBite",
    emoji: "🐍",
    question: { cs: "Že tě dnes uštkne jedovatý had", en: "That a venomous snake bites you today" },
    odds: "1 : 2 600 000",
    oneIn: 2_600_000,
    explanation: {
      cs: "Pokud nežiješ v Austrálii. Tam si toto číslo vynásob něčím znepokojivým.",
      en: "Unless you live in Australia. There, multiply this number by something concerning.",
    },
  },
  {
    id: "dejaVu",
    emoji: "🔁",
    question: { cs: "Že právě teď zažíváš déjà vu", en: "That you're experiencing déjà vu right now" },
    odds: "1 : 730",
    oneIn: 730,
    explanation: {
      cs: "Měl jsi pocit, že už jsi tuhle větu četl? Měl jsi pocit, že už jsi tuhle větu četl?",
      en: "Did you feel like you'd read this sentence before? Did you feel like you'd read this sentence before?",
    },
  },
  {
    id: "findMoney",
    emoji: "💵",
    question: { cs: "Že dnes najdeš peníze na ulici", en: "That you'll find money on the street today" },
    odds: "1 : 220",
    oneIn: 220,
    explanation: {
      cs: "Průměrný Američan najde za rok asi 50 dolarů na zemi. Dívej se dolů častěji. Ale ne moc, vrazil bys do lampy.",
      en: "The average person finds about $50 on the ground per year. Look down more often. But not too much, you'd hit a lamppost.",
    },
  },
  {
    id: "allGreenLights",
    emoji: "🚦",
    question: { cs: "Že projedeš všechny semafory na zelenou", en: "That you hit all green lights on your commute" },
    odds: "1 : 4 096",
    oneIn: 4_096,
    explanation: {
      cs: "Stane se to přesně v den, kdy nikam nespěcháš. Semafory čtou tvůj kalendář.",
      en: "It happens exactly on the day you're in no rush. Traffic lights read your calendar.",
    },
  },
  {
    id: "bornLeapDay",
    emoji: "📅",
    question: { cs: "Že se někdo narodí 29. února", en: "That someone is born on February 29th" },
    odds: "1 : 1 461",
    oneIn: 1_461,
    explanation: {
      cs: "Technicky slaví narozeniny jednou za čtyři roky. Buď jsou věčně mladí, nebo věčně podvedení.",
      en: "Technically they have a birthday once every four years. Either eternally young or eternally cheated.",
    },
  },
  {
    id: "identicalTwins",
    emoji: "👯",
    question: { cs: "Že se narodí jednovaječná dvojčata", en: "That a pregnancy produces identical twins" },
    odds: "1 : 250",
    oneIn: 250,
    explanation: {
      cs: "Příroda občas zmáčkne Ctrl+C, Ctrl+V. Vědci dodnes přesně nevědí, proč zrovna tady.",
      en: "Nature occasionally hits Ctrl+C, Ctrl+V. Scientists still don't fully know why it happens here.",
    },
  },
  {
    id: "coinEdge",
    emoji: "🪙",
    question: { cs: "Že mince spadne na hranu", en: "That a coin lands on its edge" },
    odds: "1 : 6 000",
    oneIn: 6_000,
    explanation: {
      cs: "Schrödingerova mince — ani panna, ani orel. Rozhodovací paralýza ve formě kovu.",
      en: "Schrödinger's coin — neither heads nor tails. Decision paralysis in metal form.",
    },
  },
  {
    id: "vendingFree",
    emoji: "🥤",
    question: { cs: "Že automat vydá dva nápoje místo jednoho", en: "That a vending machine gives you two drinks instead of one" },
    odds: "1 : 4 400",
    oneIn: 4_400,
    explanation: {
      cs: "Malá vesmírná spravedlnost za všechny ty zaseknuté sušenky. Užij si ji, je dočasná.",
      en: "A small cosmic justice for all those stuck snacks. Enjoy it, it's temporary.",
    },
  },
  {
    id: "wifiFirstTry",
    emoji: "📶",
    question: { cs: "Že se WiFi připojí napoprvé bez restartu", en: "That WiFi connects on the first try without a restart" },
    odds: "1 : 19",
    oneIn: 19,
    explanation: {
      cs: "Vzácnější než bys čekal. Router má vlastní vůli a tu noc, kdy spěcháš, ji použije proti tobě.",
      en: "Rarer than you'd expect. The router has free will and uses it against you on the night you're in a hurry.",
    },
  },
  {
    id: "rockPaperScissors",
    emoji: "✊",
    question: { cs: "Že vyhraješ kámen-nůžky-papír pětkrát po sobě", en: "That you win rock-paper-scissors five times in a row" },
    odds: "1 : 243",
    oneIn: 243,
    explanation: {
      cs: "Lidé nejsou náhodní generátory. Pokud znáš psychologii soupeře, tahle čísla lžou v tvůj prospěch.",
      en: "Humans aren't random generators. If you know your opponent's psychology, these numbers lie in your favor.",
    },
  },
  {
    id: "bagFirst",
    emoji: "🧳",
    question: { cs: "Že tvoje zavazadlo přijede na páse jako první", en: "That your bag is first on the baggage carousel" },
    odds: "1 : 150",
    oneIn: 150,
    explanation: {
      cs: "A v ten den nemáš naspěch. Jakmile spěcháš, tvoje zavazadlo je vždy poslední. Letiště to ví.",
      en: "And on that day you're not in a rush. The moment you are, your bag is always last. The airport knows.",
    },
  },
  {
    id: "doppelganger",
    emoji: "👥",
    question: { cs: "Že někde na světě potkáš svého dvojníka", en: "That you'll meet your doppelgänger somewhere in the world" },
    odds: "1 : 1 000 000 000",
    oneIn: 1_000_000_000,
    explanation: {
      cs: "Pravděpodobnost dvou identických tváří je nepatrná. Přesto má prý každý někde sedm dvojníků. Statistika a folklór se neshodnou.",
      en: "The chance of two truly identical faces is tiny. Yet folklore says everyone has seven doubles. Statistics and folklore disagree.",
    },
  },
  {
    id: "guessPin",
    emoji: "🔢",
    question: { cs: "Že uhodneš cizí PIN napoprvé", en: "That you guess a stranger's PIN on the first try" },
    odds: "1 : 10 000",
    oneIn: 10_000,
    explanation: {
      cs: "Ledaže by to bylo 1234 nebo 0000. Pak je to znepokojivě pravděpodobné. Změň si PIN.",
      en: "Unless it's 1234 or 0000. Then it's disturbingly likely. Go change your PIN.",
    },
  },
  {
    id: "catCares",
    emoji: "🐈",
    question: { cs: "Že tvoje kočka přijde, když ji zavoláš", en: "That your cat comes when you call it" },
    odds: "1 : 12",
    oneIn: 12,
    explanation: {
      cs: "Kočka tě slyší. Kočka rozumí. Kočka se rozhodla, že ne. To není neschopnost, to je životní filozofie.",
      en: "The cat hears you. The cat understands. The cat has decided no. That's not inability, that's a philosophy of life.",
    },
  },
  {
    id: "phoneSurvives",
    emoji: "📱",
    question: { cs: "Že upuštěný telefon přežije bez prasklého displeje", en: "That a dropped phone survives without a cracked screen" },
    odds: "1 : 3,5",
    oneIn: 3.5,
    explanation: {
      cs: "Závisí na výšce, úhlu a tom, jestli sis koupil obal. Většinou ne. Murphy má rád sklo.",
      en: "Depends on height, angle, and whether you bought a case. Usually you didn't. Murphy loves glass.",
    },
  },
  {
    id: "sneezeEyesOpen",
    emoji: "🤧",
    question: { cs: "Že kýchneš s otevřenýma očima", en: "That you sneeze with your eyes open" },
    odds: "1 : 100 000",
    oneIn: 100_000,
    explanation: {
      cs: "Mýtus říká, že by ti vypadly oči. Nevypadly by. Ale tělo to radši nezkouší. Evoluce je opatrná.",
      en: "Myth says your eyes would pop out. They wouldn't. But the body would rather not test it. Evolution is cautious.",
    },
  },
  {
    id: "spaceDebris",
    emoji: "🛰️",
    question: { cs: "Že tě trefí kus vesmírného odpadu", en: "That you're hit by a piece of space debris" },
    odds: "1 : 21 000 000 000 000",
    oneIn: 21_000_000_000_000,
    explanation: {
      cs: "Nad hlavou ti krouží tisíce kusů kovu. Klidně spi. Pravděpodobně. Asi. Možná.",
      en: "Thousands of metal pieces orbit above your head. Sleep well. Probably. Likely. Maybe.",
    },
  },
  {
    id: "becomeAstronaut",
    emoji: "🚀",
    question: { cs: "Že se z žadatele stane astronaut", en: "That an applicant becomes an astronaut" },
    odds: "1 : 1 500",
    oneIn: 1_500,
    explanation: {
      cs: "NASA přijme zlomek uchazečů. Snazší je dostat se na Harvard. Třikrát. Současně.",
      en: "NASA accepts a fraction of applicants. It's easier to get into Harvard. Three times. Simultaneously.",
    },
  },
  {
    id: "autocorrectFunny",
    emoji: "⌨️",
    question: { cs: "Že autokorekt udělá zprávu vtipnější, ne trapnější", en: "That autocorrect makes your message funnier, not worse" },
    odds: "1 : 88",
    oneIn: 88,
    explanation: {
      cs: "Většinou ti změní 'ahoj' na něco, co posíláš šéfovi se studeným potem. Občas je to ale komediální genius.",
      en: "Usually it changes 'hi' into something you send your boss in a cold sweat. But occasionally it's a comedic genius.",
    },
  },
  {
    id: "wrongPerson",
    emoji: "📩",
    question: { cs: "Že pošleš zprávu špatnému člověku", en: "That you send a message to the wrong person" },
    odds: "1 : 33",
    oneIn: 33,
    explanation: {
      cs: "A bude to přesně ta zpráva, kterou ten člověk neměl vidět. Pravděpodobnost trapnosti roste s citlivostí obsahu.",
      en: "And it'll be exactly the message that person shouldn't have seen. The probability of embarrassment scales with how sensitive it is.",
    },
  },
  {
    id: "matchingSocks",
    emoji: "🧦",
    question: { cs: "Že naslepo vytáhneš pár stejných ponožek", en: "That you blindly pull a matching pair of socks" },
    odds: "1 : 7",
    oneIn: 7,
    explanation: {
      cs: "Pračka jednu ponožku z páru vždycky sní. Je to daň za čistotu. Nikdo neví, kam mizí.",
      en: "The washing machine always eats one sock from a pair. It's the tax on cleanliness. Nobody knows where they go.",
    },
  },
  {
    id: "rainbowDouble",
    emoji: "🌈",
    question: { cs: "Že dnes uvidíš dvojitou duhu", en: "That you'll see a double rainbow today" },
    odds: "1 : 9 000",
    oneIn: 9_000,
    explanation: {
      cs: "A nebudeš mít u sebe foťák. Nebo budeš, ale baterka bude na nule. Krása je prchavá.",
      en: "And you won't have a camera. Or you will, but the battery will be dead. Beauty is fleeting.",
    },
  },
  {
    id: "nameInMovie",
    emoji: "🎬",
    question: { cs: "Že uslyšíš své jméno v náhodném filmu", en: "That you'll hear your name in a random movie" },
    odds: "1 : 65",
    oneIn: 65,
    explanation: {
      cs: "Záleží, jak časté máš jméno. Pokud se jmenuješ John, je to skoro jistota. Pokud Květoslav, hodně štěstí.",
      en: "Depends how common your name is. If you're a John, it's nearly certain. If you're a Květoslav, good luck.",
    },
  },
  {
    id: "songOnRadio",
    emoji: "📻",
    question: { cs: "Že zrovna pomyslíš na píseň a ona zahraje v rádiu", en: "That you think of a song and it plays on the radio" },
    odds: "1 : 980",
    oneIn: 980,
    explanation: {
      cs: "Když se to stane, máš pocit, že máš schopnosti. Nemáš. Jen si nepamatuješ tisíce případů, kdy nic nehrálo.",
      en: "When it happens, you feel psychic. You're not. You just don't remember the thousand times nothing played.",
    },
  },
  {
    id: "quicksand",
    emoji: "🏜️",
    question: { cs: "Že umřeš v tekutém písku, jak slibovaly filmy z 90. let", en: "That you die in quicksand like 90s movies promised" },
    odds: "1 : 100 000 000",
    oneIn: 100_000_000,
    explanation: {
      cs: "Dětství tě připravovalo na hrozbu, která prakticky neexistuje. Tekutý písek tě navíc vyplaví, nestáhne. Hollywood lhal.",
      en: "Childhood prepared you for a threat that barely exists. Quicksand actually floats you, doesn't pull you under. Hollywood lied.",
    },
  },
  {
    id: "beeAllergy",
    emoji: "🐝",
    question: { cs: "Že máš silnou alergickou reakci na včelí bodnutí", en: "That you have a severe allergic reaction to a bee sting" },
    odds: "1 : 1 400",
    oneIn: 1_400,
    explanation: {
      cs: "Většina lidí jen zakleje a otok přejde. Malá část to má vážně. Včela přitom umírá vždycky. Tragédie obou stran.",
      en: "Most people just curse and the swelling fades. A small fraction has it seriously. The bee dies every time though. A tragedy for both sides.",
    },
  },
  {
    id: "presidentName",
    emoji: "🎩",
    question: { cs: "Že prezident má stejné křestní jméno jako ty", en: "That a president shares your first name" },
    odds: "1 : 45",
    oneIn: 45,
    explanation: {
      cs: "Historie je plná Jamesů a Johnů. Pokud tě tak rodiče pojmenovali, máš statistickou výhodu k moci. Teoreticky.",
      en: "History is full of Jameses and Johns. If your parents named you that, you have a statistical edge to power. Theoretically.",
    },
  },
  {
    id: "elevatorStuck",
    emoji: "🛗",
    question: { cs: "Že uvízneš ve výtahu", en: "That you'll get stuck in an elevator" },
    odds: "1 : 100 000",
    oneIn: 100_000,
    explanation: {
      cs: "A když ano, bude to ten den, kdy zoufale potřebuješ na záchod. Vesmír má pro to smysl pro humor.",
      en: "And if you do, it'll be the day you desperately need the bathroom. The universe has a sense of humor about this.",
    },
  },
  {
    id: "leftHanded",
    emoji: "✍️",
    question: { cs: "Že se narodí levák", en: "That someone is born left-handed" },
    odds: "1 : 10",
    oneIn: 10,
    explanation: {
      cs: "Svět je navržený pro praváky — nůžky, sešity, kliky. Leváci žijí v nepřátelské zemi a nikdo o tom nemluví.",
      en: "The world is designed for right-handers — scissors, notebooks, door handles. Lefties live in a hostile land and nobody talks about it.",
    },
  },
  {
    id: "ballAtGame",
    emoji: "⚾",
    question: { cs: "Že chytíš míč na zápase", en: "That you'll catch a ball at a sports game" },
    odds: "1 : 1 000",
    oneIn: 1_000,
    explanation: {
      cs: "A když přiletí, buď ho chytíš jako hrdina, nebo ho upustíš před kamerami na celý stadion. Žádná střední cesta.",
      en: "And when it comes, you either catch it like a hero or drop it on camera in front of the whole stadium. No middle ground.",
    },
  },
  {
    id: "birthExists",
    emoji: "🌍",
    question: { cs: "Že ses vůbec narodil zrovna ty", en: "That you specifically were ever born at all" },
    odds: "1 : 400 000 000 000 000",
    oneIn: 400_000_000_000_000,
    explanation: {
      cs: "Správný spermie, správné vajíčko, miliony let předků, kteří všichni přežili. Tvoje existence je nejnepravděpodobnější věc na tomto seznamu. Užij si ji.",
      en: "The right sperm, the right egg, millions of years of ancestors who all survived. Your existence is the most improbable thing on this list. Enjoy it.",
    },
  },
  {
    id: "dogLooksLikeOwner",
    emoji: "🐕",
    question: { cs: "Že pes vypadá jako jeho majitel", en: "That a dog looks like its owner" },
    odds: "1 : 3",
    oneIn: 3,
    explanation: {
      cs: "Výzkumy ukazují, že lidé si nevědomky vybírají psy podobné sobě. Tvůj pes je zrcadlo, kterému jsi dal jméno.",
      en: "Research shows people unconsciously pick dogs that resemble themselves. Your dog is a mirror you gave a name to.",
    },
  },
  {
    id: "rememberDream",
    emoji: "💭",
    question: { cs: "Že si ráno zapamatuješ svůj sen", en: "That you'll remember your dream in the morning" },
    odds: "1 : 8",
    oneIn: 8,
    explanation: {
      cs: "Mozek maže sny záměrně. Kdyby sis pamatoval všechno, nerozeznal bys realitu od noční chobotnice. Vrať se k otázce o snech.",
      en: "The brain deletes dreams on purpose. If you remembered everything, you couldn't tell reality from a nighttime octopus. See the dream question.",
    },
  },
  {
    id: "winClawMachine",
    emoji: "🕹️",
    question: { cs: "Že vyhraješ plyšáka v automatu s drápem", en: "That you win a plush from a claw machine" },
    odds: "1 : 23",
    oneIn: 23,
    explanation: {
      cs: "Drápy jsou často naprogramované, aby chytaly pevně jen občas. Není to tvoje neschopnost, je to byznys model.",
      en: "Claws are often programmed to grip firmly only occasionally. It's not your incompetence, it's a business model.",
    },
  },
  {
    id: "twoSameOutfit",
    emoji: "👗",
    question: { cs: "Že přijdeš na akci ve stejném oblečení jako někdo jiný", en: "That you show up in the same outfit as someone else" },
    odds: "1 : 210",
    oneIn: 210,
    explanation: {
      cs: "A bude to ten člověk, kterému to sluší víc. Pravděpodobnost vyšší v obchodech s rychlou módou.",
      en: "And it'll be the person it suits better. Probability higher with fast-fashion stores.",
    },
  },
  {
    id: "redLightAll",
    emoji: "🔴",
    question: { cs: "Že chytneš všechny semafory na červenou", en: "That you hit every red light on your way" },
    odds: "1 : 4 096",
    oneIn: 4_096,
    explanation: {
      cs: "Subjektivně se ti to děje každý den. Objektivně si pamatuješ jen ty frustrující dny. Mozek sbírá křivdy.",
      en: "Subjectively this happens every day. Objectively you only remember the frustrating ones. The brain collects grievances.",
    },
  },
  {
    id: "openBookSamePage",
    emoji: "📖",
    question: { cs: "Že otevřeš knihu přesně na stránce, kterou hledáš", en: "That you open a book exactly to the page you need" },
    odds: "1 : 320",
    oneIn: 320,
    explanation: {
      cs: "Když se to povede, cítíš se jako čaroděj. Vesmír ti dal jeden bod. Nevsázej na to znovu.",
      en: "When it works, you feel like a wizard. The universe gave you one point. Don't bet on it again.",
    },
  },
  {
    id: "centenarian",
    emoji: "🎈",
    question: { cs: "Že se dožiješ sta let", en: "That you'll live to 100" },
    odds: "1 : 56",
    oneIn: 56,
    explanation: {
      cs: "Šance roste každým rokem, kdy lékaři objeví něco nového. Možná je tohle číslo už zastaralé. Drž se.",
      en: "The odds rise every year doctors discover something new. Maybe this number is already outdated. Hang in there.",
    },
  },
  {
    id: "tornSamePlace",
    emoji: "🧩",
    question: { cs: "Že dvě skládačky zapadnou napoprvé bez zkoušení", en: "That two puzzle pieces fit on the first try without testing" },
    odds: "1 : 40",
    oneIn: 40,
    explanation: {
      cs: "Drobné vítězství, které nikdo neocení. Ale ty to víš. A to stačí. Tak trochu.",
      en: "A tiny victory nobody will appreciate. But you know. And that's enough. Sort of.",
    },
  },

  {
    id: "shootingStar", emoji: "🌠",
    question: { cs: "Že dnes v noci uvidíš padající hvězdu", en: "That you'll see a shooting star tonight" },
    odds: "1 : 2 100", oneIn: 2_100,
    explanation: { cs: "Padají pořád. Problém je, že se zrovna koukáš do telefonu.", en: "They fall all the time. The problem is you're looking at your phone." },
  },
  {
    id: "stairsUp", emoji: "🪜",
    question: { cs: "Že zakopneš nahoru po schodech", en: "That you trip going up the stairs" },
    odds: "1 : 1 300", oneIn: 1_300,
    explanation: { cs: "Gravitace si tě najde i proti směru. Hrdost utrpí víc než koleno.", en: "Gravity finds you even going up. Your pride hurts more than your knee." },
  },
  {
    id: "blueMoon", emoji: "🌕",
    question: { cs: "Že v jednom měsíci vyjdou dva úplňky", en: "That a single month has two full moons" },
    odds: "1 : 2 700", oneIn: 2_700,
    explanation: { cs: "Říká se tomu modrý měsíc. Odtud to slovní spojení o uherském roce.", en: "It's called a blue moon. Hence the saying about once in a blue moon." },
  },
  {
    id: "crosswalkGreen", emoji: "🚶",
    question: { cs: "Že dojdeš k přechodu přesně když naskočí zelená", en: "That you reach the crossing exactly as it turns green" },
    odds: "1 : 1 500", oneIn: 1_500,
    explanation: { cs: "Stane se to v den, kdy nikam nespěcháš. Semafory čtou tvůj kalendář.", en: "It happens on the day you're in no rush. Traffic lights read your calendar." },
  },
  {
    id: "tripleSneeze", emoji: "🤧",
    question: { cs: "Že kýchneš přesně třikrát po sobě", en: "That you sneeze exactly three times in a row" },
    odds: "1 : 1 100", oneIn: 1_100,
    explanation: { cs: "Tělo má rádo trojky. Dvakrát je málo, čtyřikrát už voláš doktora.", en: "The body likes threes. Twice is too few, four times and you call a doctor." },
  },
  {
    id: "doubleYolk", emoji: "🥚",
    question: { cs: "Že rozklepneš vejce se dvěma žloutky", en: "That you crack an egg with two yolks" },
    odds: "1 : 1 056", oneIn: 1_056,
    explanation: { cs: "Dvojitý žloutek, dvojitá omeleta. Slepice občas přitlačí.", en: "Double yolk, double omelette. The hen occasionally overachieves." },
  },
  {
    id: "perfectToast", emoji: "🍞",
    question: { cs: "Že toustovač vyhodí dokonale opečený toust napoprvé", en: "That the toaster pops out perfectly browned toast on the first try" },
    odds: "1 : 1 900", oneIn: 1_900,
    explanation: { cs: "Toustovač má dvě nastavení: bledý a uhlík. Dokonalost je nehoda.", en: "A toaster has two settings: pale and charcoal. Perfection is an accident." },
  },
  {
    id: "redditFront", emoji: "📰",
    question: { cs: "Že tvůj příspěvek se dostane na hlavní stránku internetu", en: "That your post reaches the front page of the internet" },
    odds: "1 : 6 500", oneIn: 6_500,
    explanation: { cs: "Algoritmus je bůh nálad. Stejný vtip je jednou hit, podruhé ticho.", en: "The algorithm is a moody god. The same joke is a hit once, silence the next." },
  },
  {
    id: "viralVideo", emoji: "🎥",
    question: { cs: "Že se tvoje video stane virálním", en: "That your video goes viral" },
    odds: "1 : 1 500 000", oneIn: 1_500_000,
    explanation: { cs: "Internet rozdává slávu náhodně jako blesk. A stejně rychle tě spálí.", en: "The internet hands out fame randomly like lightning. And burns you just as fast." },
  },
  {
    id: "winRaffle", emoji: "🎟️",
    question: { cs: "Že vyhraješ v tombole", en: "That you win a raffle" },
    odds: "1 : 3 200", oneIn: 3_200,
    explanation: { cs: "Lístek máš v kapse celý večer a stejně padne číslo o jedno vedle.", en: "You hold the ticket all night and the number drawn is still one off." },
  },
  {
    id: "guessPassword", emoji: "🔐",
    question: { cs: "Že uhodneš cizí heslo napoprvé", en: "That you guess someone's password on the first try" },
    odds: "1 : 50 000", oneIn: 50_000,
    explanation: { cs: "Ledaže by to bylo 'heslo'. Pak gratuluju a soustrast majiteli.", en: "Unless it's 'password'. Then congrats, and condolences to the owner." },
  },
  {
    id: "appCrashLongMessage", emoji: "💬",
    question: { cs: "Že appka spadne těsně po dopsání dlouhé zprávy", en: "That the app crashes right after you finish a long message" },
    odds: "1 : 1 400", oneIn: 1_400,
    explanation: { cs: "Zákon zachování utrpení: čím delší zpráva, tím jistější pád.", en: "Conservation of suffering: the longer the message, the surer the crash." },
  },
  {
    id: "catKeyboard", emoji: "⌨️",
    question: { cs: "Že ti kočka přejde po klávesnici v nejhorší moment", en: "That your cat walks across the keyboard at the worst moment" },
    odds: "1 : 1 200", oneIn: 1_200,
    explanation: { cs: "Kočka nepíše náhodně. Posílá vesmíru zprávu, kterou nemáš číst.", en: "The cat isn't typing randomly. It's sending the universe a message you shouldn't read." },
  },
  {
    id: "rainbowEnd", emoji: "🌈",
    question: { cs: "Že duha skončí přesně tam, kde stojíš", en: "That a rainbow ends exactly where you're standing" },
    odds: "1 : 9 000", oneIn: 9_000,
    explanation: { cs: "Hrnec zlata ovšem nikde. Skřítci ho přesunuli, sotva ses přiblížil.", en: "No pot of gold, though. The leprechauns moved it the moment you got close." },
  },
  {
    id: "parallelParkAudience", emoji: "🚗",
    question: { cs: "Že zaparkuješ podél chodníku napoprvé a všichni to vidí", en: "That you parallel park on the first try while everyone watches" },
    odds: "1 : 1 800", oneIn: 1_800,
    explanation: { cs: "Publikum se objeví jen u nezdaru. Mistrovský kousek uvidí jen prázdná ulice.", en: "An audience only shows up for failure. The masterstroke is seen by an empty street." },
  },
  {
    id: "chessVsComputer", emoji: "♟️",
    question: { cs: "Že porazíš počítač na nejtěžší obtížnost", en: "That you beat the computer on the hardest difficulty" },
    odds: "1 : 25 000", oneIn: 25_000,
    explanation: { cs: "Stroj nezapomíná, nespí a neudělá hloupou chybu. Ty děláš všechny tři.", en: "The machine never forgets, never sleeps, never blunders. You do all three." },
  },
  {
    id: "birdPoop", emoji: "🐦",
    question: { cs: "Že tě dnes trefí ptačí dárek z nebe", en: "That a bird leaves you a gift from above today" },
    odds: "1 : 1 300", oneIn: 1_300,
    explanation: { cs: "Prý to nosí štěstí. To vymyslel někdo, koho zrovna trefili.", en: "They say it brings luck. That was invented by someone who'd just been hit." },
  },
  {
    id: "fourSeasonsDay", emoji: "🌦️",
    question: { cs: "Že zažiješ všechna čtyři roční období v jednom dni", en: "That you experience all four seasons in a single day" },
    odds: "1 : 4 500", oneIn: 4_500,
    explanation: { cs: "Příroda občas zmáčkne tlačítko náhody a ty nevíš, co si vzít na sebe.", en: "Nature occasionally hits the shuffle button and you have no idea what to wear." },
  },
  {
    id: "matchingPlate", emoji: "🔢",
    question: { cs: "Že potkáš auto s téměř stejnou SPZ jako tvoje", en: "That you spot a car with almost the same plate as yours" },
    odds: "1 : 7 000", oneIn: 7_000,
    explanation: { cs: "Mozek hledá vzory všude. SPZ je jen čísla, dokud jedno nepoznáš.", en: "The brain hunts for patterns everywhere. A plate is just numbers until one looks familiar." },
  },
  {
    id: "guessAge", emoji: "🎂",
    question: { cs: "Že někdo uhodne tvůj věk úplně přesně", en: "That someone guesses your exact age" },
    odds: "1 : 1 200", oneIn: 1_200,
    explanation: { cs: "Když se trefí, jsi polichocen i uražen zároveň. Záleží na směru chyby.", en: "When they nail it, you're flattered and offended at once. Depends which way they'd have erred." },
  },
  {
    id: "deadPixel", emoji: "🖥️",
    question: { cs: "Že nový monitor má mrtvý pixel přesně uprostřed", en: "That a new monitor has a dead pixel right in the center" },
    odds: "1 : 3 400", oneIn: 3_400,
    explanation: { cs: "Z milionu pixelů selže ten jediný, který nikdy nepřehlédneš.", en: "Out of a million pixels, the one that fails is the one you'll never unsee." },
  },
  {
    id: "batteryAtOne", emoji: "🔋",
    question: { cs: "Že ti telefon zhasne přesně na 1 %", en: "That your phone dies at exactly 1%" },
    odds: "1 : 1 500", oneIn: 1_500,
    explanation: { cs: "To poslední procento je lhář. Někdy vydrží hodinu, někdy do půlky věty.", en: "That last percent is a liar. Sometimes an hour, sometimes mid-sentence." },
  },
  {
    id: "perfectAvocado", emoji: "🥑",
    question: { cs: "Že koupíš avokádo akorát zralé", en: "That you buy a perfectly ripe avocado" },
    odds: "1 : 1 700", oneIn: 1_700,
    explanation: { cs: "Mezi kamenem a hnilobou je okno dlouhé 11 vteřin. Trefíš ho jednou za život.", en: "Between rock-hard and rotten there's an 11-second window. You hit it once a lifetime." },
  },
  {
    id: "spotISS", emoji: "🛰️",
    question: { cs: "Že nad tebou zrovna teď přeletí ISS a uvidíš ji", en: "That the ISS passes overhead right now and you see it" },
    odds: "1 : 5 200", oneIn: 5_200,
    explanation: { cs: "Šest lidí ti právě prolétlo nad hlavou rychlostí 28 000 km/h. Zamávej.", en: "Six people just flew over your head at 28,000 km/h. Wave." },
  },
  {
    id: "moonbow", emoji: "🌙",
    question: { cs: "Že uvidíš měsíční duhu", en: "That you see a moonbow" },
    odds: "1 : 30 000", oneIn: 30_000,
    explanation: { cs: "Duha za svitu měsíce. Tak vzácná, že ti nikdo neuvěří bez fotky.", en: "A rainbow by moonlight. So rare nobody believes you without a photo." },
  },
  {
    id: "winBingo", emoji: "🎱",
    question: { cs: "Že vyhraješ bingo hned v prvním kole", en: "That you win bingo on the very first round" },
    odds: "1 : 8 000", oneIn: 8_000,
    explanation: { cs: "A jediný den, kdy nehraješ o nic, vyhraješ úplně všechno.", en: "And the one day nothing's at stake, you win it all." },
  },
  {
    id: "firstPancake", emoji: "🥞",
    question: { cs: "Že první palačinka vyjde dokonale", en: "That the first pancake comes out perfect" },
    odds: "1 : 3 000", oneIn: 3_000,
    explanation: { cs: "První palačinka je oběť bohům pánve. Vždycky. To je zákon.", en: "The first pancake is a sacrifice to the gods of the pan. Always. It's the law." },
  },
  {
    id: "catchFallingPhone", emoji: "📱",
    question: { cs: "Že chytíš padající telefon než dopadne", en: "That you catch a falling phone before it lands" },
    odds: "1 : 1 400", oneIn: 1_400,
    explanation: { cs: "Reflexy hrdiny se probudí jen u cizího telefonu. Ten svůj upustíš.", en: "Hero reflexes only kick in for someone else's phone. Your own you drop." },
  },
  {
    id: "guessTwist", emoji: "🎬",
    question: { cs: "Že uhodneš zvrat ve filmu už v první minutě", en: "That you guess the movie's twist in the first minute" },
    odds: "1 : 1 600", oneIn: 1_600,
    explanation: { cs: "A nahlas to řekneš. Tím si zajistíš samotu u příštího filmu.", en: "And you say it out loud. Guaranteeing solitude for the next movie." },
  },
  {
    id: "coinTen", emoji: "🪙",
    question: { cs: "Že hodíš pannu desetkrát po sobě", en: "That you flip heads ten times in a row" },
    odds: "1 : 1 024", oneIn: 1_024,
    explanation: { cs: "Mince nemá paměť. Po deváté panně je desátá pořád padesát na padesát.", en: "A coin has no memory. After nine heads, the tenth is still fifty-fifty." },
  },
  {
    id: "rareName", emoji: "🧑",
    question: { cs: "Že dva lidé v místnosti mají stejné neobvyklé jméno", en: "That two people in a room share the same unusual name" },
    odds: "1 : 4 200", oneIn: 4_200,
    explanation: { cs: "U Honzy nuda, u Květoslava menší zázrak. Vzácnost jména rozhoduje.", en: "With a John it's boring; with a Květoslav it's a minor miracle. Rarity decides." },
  },
  {
    id: "shufflePerfect", emoji: "🎧",
    question: { cs: "Že shuffle pustí přesně tu píseň, na kterou jsi myslel", en: "That shuffle plays exactly the song you were thinking of" },
    odds: "1 : 2 300", oneIn: 2_300,
    explanation: { cs: "Cítíš se vyvolený. Ve skutečnosti tě algoritmus poslouchá líp než přátelé.", en: "You feel chosen. In reality the algorithm listens to you better than your friends do." },
  },
  {
    id: "scratchProfit", emoji: "🎫",
    question: { cs: "Že stírací los vyhraje víc, než stál", en: "That a scratch card wins more than it cost" },
    odds: "1 : 1 300", oneIn: 1_300,
    explanation: { cs: "Vyhraješ stovku, koupíš za ni další tři losy a jsi zpátky na nule.", en: "You win a few bucks, buy three more cards with it, and you're back to zero." },
  },
  {
    id: "latteArt", emoji: "☕",
    question: { cs: "Že barista nakreslí do pěny něco rozpoznatelného", en: "That the barista draws something recognizable in the foam" },
    odds: "1 : 1 500", oneIn: 1_500,
    explanation: { cs: "Je to labuť, nebo srdce, nebo kaňka? Vyfotíš to dřív, než se rozhodneš.", en: "Is it a swan, a heart, or a blob? You photograph it before deciding." },
  },
  {
    id: "perfectQuiz", emoji: "🧠",
    question: { cs: "Že dáš v kvízu plný počet bodů bez učení", en: "That you ace a quiz with zero studying" },
    odds: "1 : 5 000", oneIn: 5_000,
    explanation: { cs: "Náhoda a sebevědomí občas vytvoří dokonalou bouři správných odpovědí.", en: "Chance and confidence occasionally brew a perfect storm of right answers." },
  },
  {
    id: "stoneSkip", emoji: "🪨",
    question: { cs: "Že kámen poskočí po hladině desetkrát", en: "That a stone skips ten times across the water" },
    odds: "1 : 6 000", oneIn: 6_000,
    explanation: { cs: "Správný kámen, správný úhel, správné zápěstí. A nikdo se nedíval.", en: "The right stone, the right angle, the right wrist. And nobody was watching." },
  },
  {
    id: "rpsTen", emoji: "✊",
    question: { cs: "Že vyhraješ kámen-nůžky-papír desetkrát po sobě", en: "That you win rock-paper-scissors ten times in a row" },
    odds: "1 : 59 000", oneIn: 59_000,
    explanation: { cs: "V tu chvíli buď čteš myšlenky, nebo je tvůj soupeř velmi předvídatelný.", en: "At that point you either read minds or your opponent is very predictable." },
  },
  {
    id: "spotCelebrity", emoji: "🌟",
    question: { cs: "Že potkáš celebritu v běžném obchodě", en: "That you bump into a celebrity at an ordinary store" },
    odds: "1 : 9 000", oneIn: 9_000,
    explanation: { cs: "A buď ji nepoznáš, nebo zmrzneš. Třetí možnost neexistuje.", en: "And you either don't recognize them or freeze. There is no third option." },
  },
  {
    id: "threeSharedBirthday", emoji: "🎉",
    question: { cs: "Že tři lidé v místnosti slaví narozeniny ve stejný den", en: "That three people in a room share the same birthday" },
    odds: "1 : 130 000", oneIn: 130_000,
    explanation: { cs: "Narozeninový paradox má staršího, divnějšího bratrance. Tohle je on.", en: "The birthday paradox has an older, weirder cousin. This is it." },
  },
  {
    id: "gachaSSR", emoji: "🎮",
    question: { cs: "Že vytáhneš nejvzácnější postavu napoprvé", en: "That you pull the rarest character on your first try" },
    odds: "1 : 1 500", oneIn: 1_500,
    explanation: { cs: "Hra ti dá zázrak zdarma, abys uvěřil, že příště to bude taky tak snadné.", en: "The game gives you a free miracle so you believe next time will be this easy too." },
  },
  {
    id: "catchBouquet", emoji: "💐",
    question: { cs: "Že chytíš svatební kytici", en: "That you catch the wedding bouquet" },
    odds: "1 : 1 100", oneIn: 1_100,
    explanation: { cs: "Tradice slibuje svatbu. Statistika slibuje pohmožděný loket.", en: "Tradition promises a wedding. Statistics promise a bruised elbow." },
  },
  {
    id: "duckRace", emoji: "🦆",
    question: { cs: "Že tvoje gumová kachna vyhraje závod", en: "That your rubber duck wins the race" },
    odds: "1 : 3 000", oneIn: 3_000,
    explanation: { cs: "Tisíc identických kachen, jeden proud. Vyhraje ta, na kterou jsi nevsadil.", en: "A thousand identical ducks, one current. The winner is the one you didn't pick." },
  },
  {
    id: "freeThrowBehind", emoji: "🏀",
    question: { cs: "Že trefíš koš zezadu přes hlavu napoprvé", en: "That you sink a basket backwards over your head on the first try" },
    odds: "1 : 4 000", oneIn: 4_000,
    explanation: { cs: "Povede se to jen, když to nikdo nenatáčí. Zázraky jsou stydlivé.", en: "It only works when nobody's filming. Miracles are shy." },
  },
  {
    id: "diceSumThrice", emoji: "🎲",
    question: { cs: "Že uhodneš součet dvou kostek třikrát po sobě", en: "That you guess the sum of two dice three times in a row" },
    odds: "1 : 7 776", oneIn: 7_776,
    explanation: { cs: "Sedmička padá nejčastěji. Ostatní jsou jen zbožná přání.", en: "Seven comes up most. The rest is just wishful thinking." },
  },
  {
    id: "priceExact", emoji: "📺",
    question: { cs: "Že trefíš cenu zboží na korunu přesně", en: "That you guess a product's price to the penny" },
    odds: "1 : 100 000", oneIn: 100_000,
    explanation: { cs: "Buď jsi to nedávno kupoval, nebo máš děsivý talent na supermarkety.", en: "Either you bought it recently or you have a terrifying talent for supermarkets." },
  },
  {
    id: "sharedDream", emoji: "💑",
    question: { cs: "Že se ti a partnerovi zdá ten samý sen", en: "That you and your partner have the same dream" },
    odds: "1 : 50 000", oneIn: 50_000,
    explanation: { cs: "Ráno si to vyprávíte a oba trochu přeháníte, aby to sedělo líp.", en: "In the morning you compare and both exaggerate a little to make it fit." },
  },
  {
    id: "flipOmelette", emoji: "🍳",
    question: { cs: "Že obrátíš omeletu ve vzduchu a dopadne celá", en: "That you flip an omelette in the air and it lands intact" },
    odds: "1 : 1 900", oneIn: 1_900,
    explanation: { cs: "Devětkrát na podlaze, jednou na plakát do kuchařky. Tahle byla ta jedna.", en: "Nine times on the floor, once worthy of a cookbook cover. This was the one." },
  },
  {
    id: "ballOffPost", emoji: "⚽",
    question: { cs: "Že míč trefí tyč a odrazí se přesně do brány", en: "That the ball hits the post and bounces exactly into the goal" },
    odds: "1 : 1 300", oneIn: 1_300,
    explanation: { cs: "Pár centimetrů dělí génia od smolaře. Tyč o tom rozhodne za tebe.", en: "A few centimeters separate genius from fool. The post decides for you." },
  },
  {
    id: "perfectWrap", emoji: "🎁",
    question: { cs: "Že zabalíš dárek bez jediného přebytečného papíru", en: "That you wrap a gift with zero leftover paper" },
    odds: "1 : 2 200", oneIn: 2_200,
    explanation: { cs: "Buď zbude metr, nebo chybí roh. Střední cesta je městská legenda.", en: "Either a meter is left over or a corner is missing. The middle path is an urban legend." },
  },
  {
    id: "radioCaller", emoji: "📻",
    question: { cs: "Že se dovoláš do rádia jako stý posluchač", en: "That you get through to the radio as the hundredth caller" },
    odds: "1 : 9 000", oneIn: 9_000,
    explanation: { cs: "A v tu chvíli zapomeneš, jak se jmenuješ. Přímý přenos je krutý.", en: "And right then you forget your own name. Live radio is cruel." },
  },
  {
    id: "fortuneCookie", emoji: "🥠",
    question: { cs: "Že se ti splní text ze štěstíčka do týdne", en: "That your fortune cookie comes true within a week" },
    odds: "1 : 4 000", oneIn: 4_000,
    explanation: { cs: "Texty jsou tak vágní, že by se splnily i kameni. Ale tobě to udělá radost.", en: "The texts are so vague they'd come true for a rock. But it'll still make you smile." },
  },
  {
    id: "catchKeys", emoji: "🔑",
    question: { cs: "Že chytíš hozené klíče bez koukání", en: "That you catch thrown keys without looking" },
    odds: "1 : 1 400", oneIn: 1_400,
    explanation: { cs: "Jednou za čas se z tebe stane akční hrdina. Většinou klíče skončí v křoví.", en: "Once in a while you become an action hero. Usually the keys land in a bush." },
  },
  {
    id: "lightningPhoto", emoji: "🤳",
    question: { cs: "Že vyfotíš blesk v přesně pravý okamžik", en: "That you photograph lightning at exactly the right moment" },
    odds: "1 : 6 000", oneIn: 6_000,
    explanation: { cs: "Stovky pokusů, jedna dokonalá fotka, a baterka zhasne při dalším blesku.", en: "Hundreds of tries, one perfect shot, and the battery dies on the next bolt." },
  },
  {
    id: "twinWifi", emoji: "📶",
    question: { cs: "Že najdeš cizí WiFi se stejným názvem jako tvoje", en: "That you find a stranger's WiFi with the same name as yours" },
    odds: "1 : 5 000", oneIn: 5_000,
    explanation: { cs: "Někde žije člověk se stejně špatným smyslem pro humor v názvech sítí.", en: "Somewhere lives a person with the same bad sense of humor in network names." },
  },
  {
    id: "cannonball", emoji: "🏊",
    question: { cs: "Že tvoje bombička cákne přes celý bazén", en: "That your cannonball splashes across the whole pool" },
    odds: "1 : 2 500", oneIn: 2_500,
    explanation: { cs: "Sláva trvá tři vteřiny, mokrý je každý do konce dne. Stálo to za to.", en: "The glory lasts three seconds, everyone's wet till evening. Worth it." },
  },
  {
    id: "magicCard", emoji: "🃏",
    question: { cs: "Že uhodneš svou kartu v kouzelnickém triku", en: "That you guess your card in a magic trick" },
    odds: "1 : 5 200", oneIn: 5_200,
    explanation: { cs: "Kouzelník chce, abys neuhodl. Když přesto trefíš, zničil jsi mu večer.", en: "The magician wants you to fail. If you guess anyway, you've ruined his evening." },
  },
  {
    id: "famousBirthday", emoji: "🎩",
    question: { cs: "Že máš narozeniny ve stejný den jako slavná historická osobnost", en: "That you share a birthday with a famous historical figure" },
    odds: "1 : 1 200", oneIn: 1_200,
    explanation: { cs: "Sdílíš datum s géniem i s padouchem. Vyber si, kterého zmíníš na večírku.", en: "You share a date with a genius and a villain. Pick which one you mention at parties." },
  },
  {
    id: "bowlingTurkey", emoji: "🎳",
    question: { cs: "Že hodíš tři striky po sobě", en: "That you bowl three strikes in a row" },
    odds: "1 : 3 500", oneIn: 3_500,
    explanation: { cs: "Říká se tomu krocan. Proč krocan? Nikdo neví. Bowling má svá tajemství.", en: "They call it a turkey. Why a turkey? Nobody knows. Bowling keeps its secrets." },
  },
  {
    id: "waiterTiming", emoji: "🍽️",
    question: { cs: "Že číšník přijde přesně když máš plnou pusu", en: "That the waiter arrives exactly when your mouth is full" },
    odds: "1 : 1 300", oneIn: 1_300,
    explanation: { cs: "Restaurace má radar na sousta. Otázka přijde vždy v nejhorší kousnutí.", en: "Restaurants have radar for mouthfuls. The question always lands mid-bite." },
  },
  {
    id: "emptySeatNextTo", emoji: "✈️",
    question: { cs: "Že vedle tebe v plném letadle zůstane prázdné sedadlo", en: "That the seat next to you stays empty on a full flight" },
    odds: "1 : 1 100", oneIn: 1_100,
    explanation: { cs: "Malý zázrak loketní opěrky. Užij si ho, příště poletíš mezi dvěma siláky.", en: "A small armrest miracle. Enjoy it; next time you'll fly between two big guys." },
  },
  {
    id: "snailBet", emoji: "🐌",
    question: { cs: "Že vsadíš na správného hlemýždě v závodě", en: "That you bet on the right snail in a race" },
    odds: "1 : 1 500", oneIn: 1_500,
    explanation: { cs: "Závod trvá hodinu, výhru oslavíš minutu. Pořád lepší než akcie.", en: "The race takes an hour, the win you celebrate for a minute. Still better than stocks." },
  },
  {
    id: "echoSeven", emoji: "🏔️",
    question: { cs: "Že se ti ozvěna v horách vrátí přesně sedmkrát", en: "That a mountain echo returns to you exactly seven times" },
    odds: "1 : 8 000", oneIn: 8_000,
    explanation: { cs: "Zakřičíš hloupost a hory ti ji připomenou sedmkrát. Akustická pomsta.", en: "You shout something silly and the mountains remind you seven times. Acoustic revenge." },
  },
  {
    id: "greenAllWalk", emoji: "🚦",
    question: { cs: "Že projdeš městem a každý semafor naskočí na zelenou", en: "That you walk through town and every light turns green for you" },
    odds: "1 : 12 000", oneIn: 12_000,
    explanation: { cs: "Na okamžik máš pocit, že tě má město rádo. Nemá. Jen sis toho všiml.", en: "For a moment you feel the city loves you. It doesn't. You just noticed." },
  },
  {
    id: "perfectBackflip", emoji: "🤸",
    question: { cs: "Že uděláš salto vzad napoprvé a dopadneš na nohy", en: "That you land a backflip on your first attempt" },
    odds: "1 : 9 500", oneIn: 9_500,
    explanation: { cs: "Tělo si pamatuje hrdinství i hloupost stejně dobře. Vsadil jsi na obojí.", en: "The body remembers heroics and stupidity equally well. You bet on both." },
  },
  {
    id: "messageReadInstant", emoji: "📩",
    question: { cs: "Že někdo přečte tvou zprávu v tu samou vteřinu, co ji pošleš", en: "That someone reads your message the exact second you send it" },
    odds: "1 : 2 000", oneIn: 2_000,
    explanation: { cs: "Dvě modré fajfky okamžitě. Buď tě sleduje, nebo má taky nudný den.", en: "Two blue ticks instantly. Either they're watching you or they're also having a dull day." },
  },
  {
    id: "winSlots", emoji: "🎰",
    question: { cs: "Že vytočíš tři stejné symboly na automatu", en: "That you spin three matching symbols on a slot machine" },
    odds: "1 : 32 000", oneIn: 32_000,
    explanation: { cs: "Světla, fanfáry, mince. A pak zjistíš, že výhra je menší než sázka.", en: "Lights, fanfares, coins. Then you realize the prize is smaller than your bet." },
  },
  {
    id: "guessHeads", emoji: "🧞",
    question: { cs: "Že uhodneš číslo, na které právě myslí cizí člověk", en: "That you guess the number a stranger is thinking of" },
    odds: "1 : 11 000", oneIn: 11_000,
    explanation: { cs: "Většina lidí myslí na sedm. Pokud to není sedm, mysleli na tebe.", en: "Most people think of seven. If it isn't seven, they were thinking of you." },
  },
  {
    id: "rainStopExit", emoji: "🌧️",
    question: { cs: "Že déšť přestane přesně když vyjdeš ven", en: "That the rain stops exactly when you step outside" },
    odds: "1 : 2 400", oneIn: 2_400,
    explanation: { cs: "A spustí se zpátky, jakmile schováš deštník. Počasí má smysl pro pointu.", en: "And starts again the moment you put the umbrella away. Weather has comic timing." },
  },
  {
    id: "perfectFold", emoji: "🗺️",
    question: { cs: "Že složíš mapu zpátky přesně podle původních záhybů", en: "That you fold a map back along its original creases" },
    odds: "1 : 4 800", oneIn: 4_800,
    explanation: { cs: "Mapy jsou navržené tak, aby se složit nedaly. Tys porazil inženýry.", en: "Maps are engineered to be unfoldable. You beat the engineers." },
  },
  {
    id: "snowflakeTongue", emoji: "❄️",
    question: { cs: "Že chytíš sněhovou vločku na jazyk napoprvé", en: "That you catch a snowflake on your tongue on the first try" },
    odds: "1 : 1 600", oneIn: 1_600,
    explanation: { cs: "Žádné dvě vločky nejsou stejné. Tahle byla tvoje, na desetinu vteřiny.", en: "No two snowflakes are alike. This one was yours, for a tenth of a second." },
  },
  {
    id: "doorOpenHand", emoji: "🚪",
    question: { cs: "Že automatické dveře se otevřou přesně v tvém rytmu kroku", en: "That automatic doors open in perfect sync with your stride" },
    odds: "1 : 1 200", oneIn: 1_200,
    explanation: { cs: "Občas zpomalíš, protože si nevěříš. A pak do nich málem narazíš.", en: "Sometimes you slow down out of doubt. And then nearly walk into them." },
  },
  {
    id: "guessSongFirstNote", emoji: "🎵",
    question: { cs: "Že poznáš píseň podle první noty", en: "That you name a song from its first note" },
    odds: "1 : 3 600", oneIn: 3_600,
    explanation: { cs: "Jedna nota, sto možností, a ty vyhrkneš tu správnou. Mozek tě překvapí.", en: "One note, a hundred options, and you blurt out the right one. The brain surprises you." },
  },
  {
    id: "vendingNoStuck", emoji: "🥤",
    question: { cs: "Že ze čtyř automatů ani jeden nezasekne tvou svačinu", en: "That four vending machines in a row don't jam your snack" },
    odds: "1 : 5 500", oneIn: 5_500,
    explanation: { cs: "Spirála se otočí, svačina padá, nikde žádná zrada. Den je zachráněn.", en: "The coil turns, the snack drops, no betrayal anywhere. The day is saved." },
  },
  {
    id: "perfectHandshake", emoji: "🤝",
    question: { cs: "Že trefíš podání ruky a high five ve správném pořadí napoprvé", en: "That you nail a handshake-then-high-five in the right order on the first go" },
    odds: "1 : 1 300", oneIn: 1_300,
    explanation: { cs: "Sociální choreografie bez nácviku. Většinou skončí dvěma trapnými dlaněmi.", en: "Social choreography without rehearsal. Usually ends in two awkward palms." },
  },
  {
    id: "lastSeatBus", emoji: "🚌",
    question: { cs: "Že nastoupíš do plného autobusu a hned se uvolní místo vedle tebe", en: "That you board a packed bus and a seat next to you frees up immediately" },
    odds: "1 : 2 100", oneIn: 2_100,
    explanation: { cs: "Vesmír ti dá místo přesně jednu zastávku před tím, kde vystupuješ.", en: "The universe gives you a seat exactly one stop before yours." },
  },
  {
    id: "guessWeather", emoji: "🌤️",
    question: { cs: "Že odhadneš počasí líp než předpověď", en: "That you predict the weather better than the forecast" },
    odds: "1 : 1 400", oneIn: 1_400,
    explanation: { cs: "Řekneš bude pršet, prší. Jeden správný odhad a cítíš se jako meteorolog.", en: "You say it'll rain, it rains. One correct call and you feel like a meteorologist." },
  },
  {
    id: "tripleGreen", emoji: "🍀",
    question: { cs: "Že najdeš tři čtyřlístky během jedné procházky", en: "That you find three four-leaf clovers on a single walk" },
    odds: "1 : 75 000", oneIn: 75_000,
    explanation: { cs: "Buď máš oko jako jestřáb, nebo stojíš na geneticky podezřelém trávníku.", en: "Either you have a hawk's eye or you're standing on a genetically suspicious lawn." },
  },
  {
    id: "phoneRingsSilent", emoji: "🔕",
    question: { cs: "Že ti telefon zazvoní přesně v tichu na nejhorším místě", en: "That your phone rings in total silence at the worst possible place" },
    odds: "1 : 1 100", oneIn: 1_100,
    explanation: { cs: "Měl být ztlumený. Byl ztlumený. A přesto si vybral tenhle okamžik.", en: "It was supposed to be on silent. It was on silent. And still chose this moment." },
  },
  {
    id: "guessElevatorArrive", emoji: "🛗",
    question: { cs: "Že zmáčkneš tlačítko a výtah okamžitě otevře dveře", en: "That you press the button and the elevator opens its doors instantly" },
    odds: "1 : 1 500", oneIn: 1_500,
    explanation: { cs: "Na zlomek vteřiny věříš, že máš nadpřirozené schopnosti. Nemáš.", en: "For a split second you believe you have powers. You don't." },
  },
  {
    id: "doubleBookPage", emoji: "📚",
    question: { cs: "Že dvě různé knihy otevřeš na stejném čísle stránky", en: "That you open two different books to the same page number" },
    odds: "1 : 4 000", oneIn: 4_000,
    explanation: { cs: "Náhoda bez významu, kterou stejně budeš vyprávět jako osud.", en: "A meaningless coincidence you'll nonetheless retell as destiny." },
  },
  {
    id: "perfectNap", emoji: "😴",
    question: { cs: "Že se probudíš ze šlofíka přesně minutu před budíkem", en: "That you wake from a nap exactly one minute before the alarm" },
    odds: "1 : 2 800", oneIn: 2_800,
    explanation: { cs: "Vnitřní hodiny občas předčí ty digitální. A pak roky neudělají nic.", en: "Your inner clock occasionally beats the digital one. Then does nothing for years." },
  },
  {
    id: "guessDoorbell", emoji: "🔔",
    question: { cs: "Že si pomyslíš na návštěvu a vzápětí zazvoní zvonek", en: "That you think of a visitor and the doorbell rings right after" },
    odds: "1 : 6 500", oneIn: 6_500,
    explanation: { cs: "Pamatuješ si jen tenhle jeden případ. Tisíce tichých zvonků jsi zapomněl.", en: "You only remember this one time. The thousand silent doorbells you forgot." },
  },
  {
    id: "rainbowCloudFace", emoji: "☁️",
    question: { cs: "Že uvidíš na obloze mrak ve tvaru přesně té věci, na kterou myslíš", en: "That you see a cloud shaped exactly like the thing on your mind" },
    odds: "1 : 5 000", oneIn: 5_000,
    explanation: { cs: "Mozek vidí tváře a tvary všude. Mraky jsou jen ochotné plátno.", en: "The brain sees faces and shapes everywhere. Clouds are just a willing canvas." },
  },
];

// Jen odds vzácnější než 1 : 1000 (oneIn > 1000).
export const scenarios: Scenario[] = allScenarios.filter((s) => s.oneIn > 1000);

export function pickRandom(excludeId?: string): Scenario {
  const pool = excludeId ? scenarios.filter((s) => s.id !== excludeId) : scenarios;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Vybere náhodný scénář, který návštěvník ještě neviděl (podle seenIds).
 * Když už viděl všechny, kolo se resetuje — vyloučí se jen ten poslední,
 * aby se hned neopakoval.
 */
export function pickUnseen(seenIds: string[], lastId?: string): Scenario {
  let pool = scenarios.filter((s) => !seenIds.includes(s.id));
  if (pool.length === 0) {
    pool = lastId ? scenarios.filter((s) => s.id !== lastId) : scenarios;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export const oddsUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Kalkulačka pravděpodobnosti",
    title: "What are the odds?",
    intro: "Absurdní pravděpodobnosti pro absurdní svět. Jaká je šance, že…",
    roll: "Spočítat pravděpodobnost 🎲",
    rollAgain: "Další pravděpodobnost 🎲",
    chanceLabel: "Pravděpodobnost",
    contextPrefix: "To je zhruba",
    pickPrompt: "Nebo si vyber, co tě zajímá:",
    disclaimer: "Všechna čísla jsou vymyšlená s láskou a žádnou statistickou metodikou.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Probability calculator",
    title: "What are the odds?",
    intro: "Absurd probabilities for an absurd world. What are the chances that…",
    roll: "Calculate a probability 🎲",
    rollAgain: "Another probability 🎲",
    chanceLabel: "Probability",
    contextPrefix: "That's roughly",
    pickPrompt: "Or pick what you're curious about:",
    disclaimer: "All numbers are made up with love and no statistical methodology.",
  },
} as const;

type Bucket = { max: number; cs: string[]; en: string[] };

// Od nejmenších šancí (vysoké oneIn) po nejvyšší šance (nízké oneIn).
const CONTEXT_BUCKETS: Bucket[] = [
  {
    max: 3,
    cs: [
      "skoro jisté — neboj se",
      "v podstatě hotová věc",
      "víc pravděpodobné než ne",
      "sázka na jistotu",
      "skoro bys na to vsadil dům",
    ],
    en: [
      "almost certain — don't worry",
      "basically a done deal",
      "more likely than not",
      "a safe bet",
      "you'd nearly bet the house on it",
    ],
  },
  {
    max: 10,
    cs: [
      "jako hodit kostkou a trefit svoje číslo",
      "běžnější než deštivý víkend",
      "stává se to častěji, než si přiznáváš",
      "zhruba jako vytáhnout eso z balíčku dvakrát",
      "nic neobvyklého, jen si toho nevšímáš",
    ],
    en: [
      "like rolling a die and hitting your number",
      "more common than a rainy weekend",
      "happens more often than you admit",
      "about like drawing an ace twice",
      "nothing unusual, you just don't notice",
    ],
  },
  {
    max: 50,
    cs: [
      "jako uhodnout den v měsíci náhodně",
      "vzácnější než zapomenout, proč jsi přišel do pokoje",
      "asi jako trefit terč se zavázanýma očima",
      "míň časté než ztratit jednu ponožku",
      "jako vytáhnout konkrétní kartu z balíčku",
    ],
    en: [
      "like guessing the day of the month at random",
      "rarer than forgetting why you walked into a room",
      "about like hitting a dartboard blindfolded",
      "less common than losing a single sock",
      "like drawing one specific card from a deck",
    ],
  },
  {
    max: 200,
    cs: [
      "vzácnější než dobrý film v pátek večer",
      "asi jako uhodnout dvě kostky najednou",
      "míň pravděpodobné než dvojče v rodině",
      "jako narazit na známého v cizím městě",
      "vzácnější než bezchybný pracovní den",
    ],
    en: [
      "rarer than a good movie on a Friday night",
      "about like guessing two dice at once",
      "less likely than a twin in the family",
      "like running into a friend in a foreign city",
      "rarer than a flawless workday",
    ],
  },
  {
    max: 1_000,
    cs: [
      "vzácnější než deštivý den v Sahaře",
      "asi jako trefit blesk fotkou v pravý moment",
      "míň pravděpodobné než dvojitá duha",
      "jako najít konkrétní zrnko v misce rýže",
      "vzácnější než spontánní potlesk v kině",
    ],
    en: [
      "rarer than a rainy day in the Sahara",
      "about like photographing lightning at the right moment",
      "less likely than a double rainbow",
      "like finding one specific grain in a bowl of rice",
      "rarer than spontaneous applause in a cinema",
    ],
  },
  {
    max: 20_000,
    cs: [
      "méně pravděpodobné než dát hole-in-one",
      "vzácnější než narodit se 29. února",
      "asi jako uhodnout cizí čtyřmístný kód",
      "míň pravděpodobné než hrát s mincí na hranu",
      "vzácnější než upustit telefon a nerozbít ho",
    ],
    en: [
      "less likely than scoring a hole-in-one",
      "rarer than being born on February 29th",
      "about like guessing a stranger's four-digit code",
      "less likely than landing a coin on its edge",
      "rarer than dropping your phone and not cracking it",
    ],
  },
  {
    max: 1_000_000,
    cs: [
      "méně pravděpodobné než výhra v drobné loterii",
      "vzácnější než být zasažen bleskem",
      "asi jako dostat royal flush v pokeru",
      "míň pravděpodobné než potkat slavného herce v obchodě",
      "vzácnější než dvakrát po sobě stejný sen",
    ],
    en: [
      "less likely than winning a small lottery",
      "rarer than being struck by lightning",
      "about like being dealt a royal flush",
      "less likely than meeting a famous actor at the store",
      "rarer than having the same dream twice in a row",
    ],
  },
  {
    max: 100_000_000,
    cs: [
      "méně pravděpodobné než napadení žralokem",
      "vzácnější než výhra v loterii a blesk dohromady",
      "asi jako uhodnout, na co zrovna myslí cizí člověk",
      "míň pravděpodobné než přežít pád letadla — a ten je vzácný",
      "vzácnější než najít jehlu v deseti kupkách sena",
    ],
    en: [
      "less likely than a shark attack",
      "rarer than a lottery win and lightning combined",
      "about like guessing what a stranger is thinking",
      "less likely than surviving a plane crash — and those are rare",
      "rarer than a needle in ten haystacks",
    ],
  },
  {
    max: 1_000_000_000,
    cs: [
      "méně pravděpodobné než vyhrát velký jackpot",
      "vzácnější než potkat svého dvojníka",
      "asi jako trefit konkrétní vteřinu v celém roce",
      "míň pravděpodobné než dvakrát po sobě vyhrát loterii",
      "vzácnější než najít konkrétní písmeno v knihovně naslepo",
    ],
    en: [
      "less likely than winning a huge jackpot",
      "rarer than meeting your doppelgänger",
      "about like hitting one specific second in a whole year",
      "less likely than winning the lottery twice in a row",
      "rarer than blindly finding one specific letter in a library",
    ],
  },
  {
    max: Infinity,
    cs: [
      "prakticky nemožné, ale ne úplně nula",
      "vesmír by se musel hodně snažit",
      "vzácnější než tvoje vlastní existence — a ta se povedla",
      "číslo tak velké, že ho mozek odmítá pochopit",
      "teoreticky možné, prakticky sci-fi",
    ],
    en: [
      "practically impossible, but not quite zero",
      "the universe would have to try really hard",
      "rarer than your own existence — and that happened",
      "a number so big the brain refuses to grasp it",
      "theoretically possible, practically sci-fi",
    ],
  },
];

export function contextLine(oneIn: number, lang: Lang): string {
  const bucket = CONTEXT_BUCKETS.find((b) => oneIn < b.max) ?? CONTEXT_BUCKETS[CONTEXT_BUCKETS.length - 1];
  const arr = lang === "cs" ? bucket.cs : bucket.en;
  // Deterministický výběr podle oneIn — stejný scénář má vždy stejný dovětek,
  // ale sousední scénáře ve stejné kategorii dostanou jiný.
  const idx = Math.floor(oneIn) % arr.length;
  return arr[idx];
}
