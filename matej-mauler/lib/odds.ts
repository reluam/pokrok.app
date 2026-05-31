import type { Lang } from "./dictionaries";

export type Scenario = {
  id: string;
  emoji: string;
  question: { cs: string; en: string };
  odds: string;          // e.g. "1 : 700 000"
  oneIn: number;         // for the "context" line
  explanation: { cs: string; en: string };
};

export const scenarios: Scenario[] = [
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
];

export function pickRandom(excludeId?: string): Scenario {
  const pool = excludeId ? scenarios.filter((s) => s.id !== excludeId) : scenarios;
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

export function contextLine(oneIn: number, lang: Lang): string {
  if (oneIn <= 2) return lang === "cs" ? "skoro jisté" : "almost certain";
  if (oneIn < 100) return lang === "cs" ? `jako hodit ${Math.round(oneIn)}× kostkou a čekat jedničku` : `like rolling a die ${Math.round(oneIn)} times hoping for a one`;
  if (oneIn < 1_000_000) return lang === "cs" ? "méně pravděpodobné než výhra v drobné loterii" : "less likely than winning a small lottery";
  if (oneIn < 1_000_000_000) return lang === "cs" ? "méně pravděpodobné než blesk a výhra v loterii dohromady" : "less likely than lightning and a lottery win combined";
  return lang === "cs" ? "prakticky nemožné, ale ne úplně nula" : "practically impossible, but not quite zero";
}
