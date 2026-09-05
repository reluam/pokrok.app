// Registr experiencí pro pravý panel (ExperiencePanelMount mapuje pathname → tohle).
// Client-safe: žádné DB importy. slug = klíč vlákna komentářů + hodnocení (stabilní, neměnit).
//
// Texty jsou dvojjazyčné. Čeština není překlad anglické věty slovo od slova —
// popis má navnadit, ne popsat. Velká písmena na začátku vět schválně: anglická
// půlka je taky má a v přepínaném panelu by mix rejstříků vypadal jako chyba.

export type Bi = { cs: string; en: string };

/**
 * Vzhled panelu pro danou experience. Panel visí v root layoutu, tedy MIMO DOM
 * experience — nemůže si její proměnné zdědit, musí je dostat odsud.
 * Kdo téma nemá, vypadá jako Spaghetti (fallbacky v globals.css).
 */
export type PanelTheme = {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  accent: string;
  border: string;
  borderSoft: string;
  hover: string;
  fontDisplay: string;
  fontBody: string;
};

export type ExperienceInfo = {
  route: string; // přesný pathname, např. "/sound"
  slug: string; // klíč pro comments/ratings — stabilní, neměnit
  title: Bi;
  category?: string; // jazykově neutrální štítek, nepřekládá se
  description?: Bi;
  guide?: Bi[]; // volitelný návod, krok = položka
  /** Experience zatím nemá českou verzi — panel to v cs přizná. */
  enOnly?: true;
  /** Vzhled panelu. Bez něj vypadá panel jako Spaghetti. */
  theme?: PanelTheme;
};

/** Černá arkáda s neonovou zelení a CRT pixelovým fontem (components/rules/theme.tsx). */
const RULES_THEME: PanelTheme = {
  bg: "#0a0a0a",
  surface: "#141414",
  ink: "#FFFFFF",
  inkSoft: "#c8c8c8",
  inkMuted: "#6b6b6b",
  accent: "#39FF14",
  border: "rgba(57,255,20,0.35)",
  borderSoft: "rgba(57,255,20,0.18)",
  hover: "rgba(57,255,20,0.10)",
  fontDisplay: "var(--font-press), monospace",
  fontBody: "var(--font-press), monospace",
};

/** Úřední formulář: papír, inkoust, razítková modř (app/milans-world/milans-world.css). */
const MILANS_WORLD_THEME: PanelTheme = {
  bg: "#E3E6DC",
  surface: "#F4F5ED",
  ink: "#20231B",
  inkSoft: "#5C6152",
  inkMuted: "#8B907C",
  accent: "#3A38A6",
  border: "#C4C8B7",
  borderSoft: "#D6D9CB",
  hover: "rgba(58,56,166,0.10)",
  fontDisplay: "var(--msw-display), \"Arial Narrow\", sans-serif",
  fontBody: "var(--msw-sans), system-ui, sans-serif",
};

export const EXPERIENCES: ExperienceInfo[] = [
  {
    route: "/milans-world",
    slug: "milans-world",
    title: { cs: "Milanův svět", en: "Milan's World" },
    category: "game",
    theme: MILANS_WORLD_THEME,
    description: {
      cs: "Klikačka o představě, že se všechno dá vyřešit penězi. Milan má odpověď na každý tvůj životní problém — stačí mít dost peněz. Razítkuješ na úřadě a kupuješ se od popelnice až po vesmír.",
      en: "A clicker about the idea that money solves everything. Milan has an answer to any problem in your life — you just need enough money. Stamp forms at the city hall and buy your way up from a wheelie bin to the universe.",
    },
    guide: [
      { cs: "Klikej na razítko. Každé je minuta promarněná na úřadě — a za promarněný čas se platí.", en: "Click the stamp. Every stamp is a minute wasted at the office, and wasted time pays." },
      { cs: "Co vyděláš, dej do nemovitostí. Každá vydělává dál, i když nic neděláš.", en: "Spend what you earn on property — each one keeps earning while you do nothing." },
      { cs: "Vylepšení se odemykají sama, jak roste tvá agenda. Najeď na ně a uvidíš, co dělají.", en: "Upgrades unlock on their own as your paperwork grows. Hover one to see what it does." },
      { cs: "Kolonka 4 se vybírá jednou a změnit ji jde jen novou žádostí.", en: "Box 4 (your category) is picked once and can only be changed by starting over." },
      { cs: "Ukládá se to samo do prohlížeče. Cíl je z principu nedosažitelný — v tom je ten vtip.", en: "It saves itself in your browser. The goal is unreachable by design — that's the joke." },
    ],
  },
  {
    route: "/rules",
    slug: "rules",
    title: { cs: "Pravidla", en: "The Rules" },
    category: "game",
    theme: RULES_THEME,
    description: {
      cs: "Devět klasických her — slepice, bludiště, tetris, flappy, invaze, piškvorky, simon říká, závod a pac-man. Každá ti vyloží svá pravidla a v každé je tichá cesta okolo nich. Hra o tom, že pravidla někdo vymyslel.",
      en: "Nine classic games — chicken, maze, tetris, flappy, invaders, tic-tac-toe, simon says, racing and pac-man. Each states its rules, and each has a quiet way around them. A game about noticing someone made those rules up.",
    },
    guide: [
      { cs: "Každá hra ti na začátku vyloží svá pravidla. Přečti si je pozorně.", en: "Each game states its rules up front. Read them carefully." },
      { cs: "Dají se hrát poctivě a dá se vyhrát. To je ta nudná cesta.", en: "You can play them straight and win. That's the boring way." },
      { cs: "V každé je i cesta, kterou pravidla nezakazují, protože o ní nevědí.", en: "Each one also has a path the rules don't forbid, because they never considered it." },
      { cs: "Zkoušej věci, o kterých hra nemluví. Tam to začíná být zajímavé.", en: "Try the things the game never mentions. That's where it gets interesting." },
      { cs: "Po každé hře ti to řekne, cos přehlédl. I když jsi vyhrál.", en: "After each game it tells you what you missed. Even if you won." },
    ],
  },
  {
    route: "/life-manual",
    slug: "life-manual",
    title: { cs: "Manuál na život", en: "Life Manual" },
    category: "guide",
    enOnly: true,
    description: {
      cs: "Návod na život ve stylu montážního manuálu z IKEA — černobílé technické listy. Vtipné, poučné a pravdivé.",
      en: "A guide to life in the style of an IKEA assembly manual — black-and-white technical sheets. Funny, instructive and true.",
    },
    guide: [
      { cs: "Mezi listy se pohybuješ scrollem nebo šipkami.", en: "Move between sheets by scrolling or using the arrow keys." },
      { cs: "Každý číslovaný list je jeden montážní krok života — čti to jako návod z IKEA.", en: "Each numbered sheet is one assembly step for life — read it like an IKEA manual." },
      { cs: "Ta černobílá strohost je schválně; vtipy stojí na tom, že se nikdo nesměje.", en: "It's deadpan black & white on purpose; the jokes are load-bearing." },
    ],
  },
  {
    route: "/encyclopedia",
    slug: "encyclopedia",
    title: { cs: "Encyklopedie", en: "The Encyclopedia" },
    category: "wiki",
    description: {
      cs: "Interaktivní encyklopedie propojená nudlemi poznání. Scrolluj od obecného ke konkrétnímu, klikáním odbočuj do stran.",
      en: "An interactive encyclopedia connected by noodles of knowledge. Scroll from the general to the specific, click sideways.",
    },
    guide: [
      { cs: "Scrolluj dolů a jdi hloub — od obecného ke konkrétnímu.", en: "Scroll down to go deeper — from the general to the specific." },
      { cs: "Klikni do strany a odboč k příbuznému tématu.", en: "Click sideways to take a detour into a related topic." },
      { cs: "Červené odkazy jsou nenapsané. Přej si je a možná vzniknou.", en: "Red links are uncharted; wish for them and they may get written." },
    ],
  },
  {
    route: "/sound",
    slug: "sound",
    title: { cs: "Cesta po zvukové vlně", en: "A journey along a sound wave" },
    category: "audio",
    description: {
      cs: "Interaktivní zvuková procházka: tvůj kurzor je ucho. Projdi zvukem od chvění přes frekvenci a barvu až po ozvěnu.",
      en: "An interactive sound experience: your cursor is an ear. Scroll through sound from a tremble through frequency and timbre to an echo.",
    },
    guide: [
      { cs: "Tvůj kurzor je ucho — hýbej s ním a poslouchej.", en: "Your cursor is an ear — move it to listen." },
      { cs: "Scrolluj po vlně: chvění → frekvence → barva → ozvěna.", en: "Scroll to travel along the wave: tremble → frequency → timbre → echo." },
      { cs: "Sluchátka vřele doporučuju.", en: "Headphones strongly recommended." },
    ],
  },
  {
    route: "/music",
    slug: "music",
    title: { cs: "Jak vzniká hudba", en: "How music is made" },
    category: "audio",
    description: {
      cs: "Interaktivní hudební studio: skládej skladbu po vrstvách — beat, basa, akordy, melodie. Mřížky, fadery a efekty jako v DAW.",
      en: "Interactive music studio: build a track layer by layer — beat, bass, chords and melody. Grids, faders and effects like in a DAW.",
    },
    guide: [
      { cs: "Skládej po vrstvách: beat, basa, akordy, melodie.", en: "Build a track layer by layer: beat, bass, chords, melody." },
      { cs: "Klikáním do mřížky pokládáš noty, fadery mixuješ.", en: "Tap grid cells to place notes; drag faders to mix." },
      { cs: "Přidej efekty jako v DAW a pusť to.", en: "Add effects like in a DAW, then hit play." },
    ],
  },
  {
    route: "/radio",
    slug: "radio",
    title: { cs: "Rádio", en: "Radio" },
    category: "audio",
    description: {
      cs: "Rádio renderované na serveru: jedna nekonečná skladba, kterou posluchači každých 15 vteřin ladí hlasováním — melodie, beat, basa, nástroj, tempo, tónina.",
      en: "Server-rendered radio: an endless mastered track that listeners tune every 15 seconds by voting — melody, beat, bass, instrument, tempo, key.",
    },
    guide: [
      { cs: "Jedna nekonečná skladba, kterou ladíme všichni dohromady.", en: "One endless track everyone tunes together." },
      { cs: "Každých 15 vteřin hlasuj a šťouchni do melodie, beatu, basy, tempa nebo tóniny.", en: "Every 15 seconds, vote to nudge melody, beat, bass, tempo or key." },
      { cs: "Nebo to nech běžet a jen poslouchej.", en: "Or just leave it on and listen." },
    ],
  },
  {
    route: "/synapsis",
    slug: "synapsis",
    title: { cs: "Synapse", en: "Synapse" },
    category: "mind",
    description: {
      cs: "Slovo → asociace. Každá odpověď posílí synapsi ve společné síti internetu. Průzkumník přidává asociace, Badatel prochází mapu.",
      en: "Word → association. Every answer strengthens a synapse in the internet's shared network. Explorer adds associations, Researcher explores the map.",
    },
    guide: [
      { cs: "Napiš první slovo, co tě napadne.", en: "Type the first word that comes to mind." },
      { cs: "Každá odpověď posílí jednu synapsi ve sdílené síti.", en: "Each answer strengthens a synapse in a shared network." },
      { cs: "Přepínej mezi Průzkumníkem (přidávat) a Badatelem (procházet mapu).", en: "Switch between Explorer (add) and Researcher (browse the map)." },
    ],
  },
  {
    route: "/decision-maker",
    slug: "decision-maker",
    title: { cs: "Rozhodovátko", en: "Decision Maker" },
    category: "tool",
    description: {
      cs: "Nástroj na rozhodnutí, když stojíš na 50/50. Pro a proti s vahami, fyzické přetahování lanem a okamžik useknutí (decidere).",
      en: "A tool for deciding when you're stuck at 50/50. Pros and cons with weights, a physical tug-of-war and the moment of cutting off (decidere).",
    },
    guide: [
      { cs: "Vypiš pro a proti a dej každému váhu.", en: "List the pros and cons, give each a weight." },
      { cs: "Sleduj, jak se přetahovaná lanem překlápí na jednu stranu.", en: "Watch the tug-of-war tilt toward a side." },
      { cs: "Usekni to a rozhodni se — decidere znamená „useknout“.", en: "Cut it off to decide — decidere means 'to cut off'." },
    ],
  },
  {
    route: "/vvv",
    slug: "vvv",
    title: { cs: "VVV — Vast Void Vault", en: "VVV — Vast Void Vault" },
    category: "wiki",
    description: {
      cs: "Encyklopedie úplnější než Stopařův průvodce po Galaxii. Zatím jí to chybí jen pár drobností.",
      en: "An encyclopedia more complete than the Hitchhiker's Guide to the Galaxy.",
    },
    guide: [
      { cs: "Procházej sbírku, která chce být úplnější než Stopařův průvodce.", en: "Browse a vault aiming to be more complete than the Hitchhiker's Guide." },
      { cs: "Bloumej mezi hesly a jdi za tím, co tě chytne.", en: "Wander the entries and follow whatever catches your eye." },
    ],
  },
  {
    route: "/hymna",
    slug: "hymna",
    title: { cs: "Hymna tvého života", en: "The anthem of your life" },
    category: "audio",
    description: {
      cs: "Odpověz na pár otázek a ono ti to složí — a zahraje — osobní hymnu tvého života: žestě, varhany, basa a bicí, poskládané z tvých odpovědí.",
      en: "Answer a handful of questions and it composes — and plays — a personal anthem for your life: brass, organ, bass and drums, arranged from your answers.",
    },
    guide: [
      { cs: "Odpověz na otázky o svém životě a o tom, jak má znít.", en: "Answer the questions about your life and how you want it to feel." },
      { cs: "Z odpovědí se poskládá celá hymna — žestě, varhany, basa, bicí.", en: "From your answers it arranges a full anthem — brass, organ, bass, drums." },
      { cs: "Zmáčkni play a narovnej se. Sluchátka doporučuju.", en: "Press play and stand up straight. Headphones recommended." },
    ],
  },
  {
    route: "/jak-to-zni",
    slug: "jak-to-zni",
    title: { cs: "Jak to zní?", en: "How does it sound?" },
    category: "audio",
    description: {
      cs: "Napiš cokoli a slyš to jako zvuk — každý znak se stane notou. Stejná slova zní úplně jinak podle toho, jakou vlnu zvolíš.",
      en: "Type any text and hear it turned into sound — each character becomes a note. The same words sound wildly different depending on the waveform.",
    },
    guide: [
      { cs: "Napiš cokoli — slovo, jméno, celou větu.", en: "Type any text — a word, a name, a whole sentence." },
      { cs: "Přeloží se to na noty a zahraje; každý znak se cestou rozsvítí.", en: "It's mapped to notes and played back; watch each character light up." },
      { cs: "Přepni vlnu nebo zkus preset a charakter zvuku se změní.", en: "Switch the waveform or try a preset to change the character of the sound." },
    ],
  },
  {
    route: "/journey",
    slug: "journey",
    title: { cs: "Cesta", en: "The Journey" },
    category: "story",
    description: {
      cs: "Vodorovné scrollytelling: scrollováním provedeš malou bytost celým obrazem života, etapu po etapě, s pár slovy na každé zastávce.",
      en: "A horizontal scrollytelling: scrolling walks a little being across the whole picture of a life, stage by stage, with a few words at each stop.",
    },
    guide: [
      { cs: "Scrolluj dolů — tvým scrollováním bytost kráčí životem dopředu.", en: "Scroll down — your scrolling walks the being forward across life." },
      { cs: "Pozadí mění barvu s každou etapou, na zastávkách naskakuje text.", en: "The background shifts colour with each stage; text appears at each stop." },
      { cs: "Nespěchej. Je to procházka, ne závod.", en: "Go slow. It's a walk, not a race." },
    ],
  },
  {
    route: "/time-remaining",
    slug: "time-remaining",
    title: { cs: "Kolik ti zbývá", en: "Time Remaining" },
    category: "tool",
    description: {
      cs: "Odpověz upřímně na pár otázek a uvidíš odhad času, který ti zbývá — nahmatatelně, abys ho možná utratil o něco líp.",
      en: "Answer a few honest questions and see an estimate of the time you have left — made tangible, so you might spend it a little better.",
    },
    guide: [
      { cs: "Proklikej pár otázek o svém životě a návycích.", en: "Tap through a handful of questions about your life and habits." },
      { cs: "Na konci dostaneš odhad zbývajícího času.", en: "At the end you get an estimate of your time remaining." },
      { cs: "Je to šťouchnutí, ne proroctví — nech to dosednout a běž žít.", en: "It's a nudge, not a prophecy — let it land, then go live." },
    ],
  },
  {
    route: "/what-are-the-odds",
    slug: "what-are-the-odds",
    title: { cs: "Jaká je šance?", en: "What are the odds?" },
    category: "tool",
    description: {
      cs: "Překvapivé pravděpodobnosti zasazené do perspektivy — skutečné šance všedních i výjimečných věcí. Zatoč si o novou nebo si vyber ze seznamu.",
      en: "Surprising probabilities put in perspective — the real odds of everyday and extraordinary things. Roll for a new one or pick from the list.",
    },
    guide: [
      { cs: "Přečti si situaci a tipni si šanci dřív, než se odhalí.", en: "Read the scenario and guess the odds before they're revealed." },
      { cs: "Zatoč a dostaneš novou náhodnou situaci.", en: "Hit roll for a fresh, random scenario." },
      { cs: "Nebo si konkrétní vyber ze seznamu.", en: "Or pick a specific one from the list." },
    ],
  },
  {
    route: "/sound-foundry",
    slug: "sound-foundry",
    title: { cs: "Zvukárna", en: "Sound Foundry" },
    category: "audio",
    description: {
      cs: "Ukovej zvuk ze slov: hledej slova-ingredience (rodinu zvuku plus modifikátory), skládej je na sebe a huť ti výsledek zesyntetizuje a zahraje.",
      en: "Forge a sound out of words: search ingredient-words (a sound family plus modifiers), stack them, and the foundry synthesises and plays the result.",
    },
    guide: [
      { cs: "Hledej slova a přidej rodinu zvuku (základ) plus pár modifikátorů.", en: "Search words and add a sound family (the base) plus a few modifiers." },
      { cs: "Huť z tvé kombinace postaví zvuk a zahraje ho.", en: "The foundry builds and plays a sound from your combination." },
      { cs: "Zatoč znovu pro jinou variaci, nebo prohoď slova a přetvař to.", en: "Re-roll for a new variation, or swap words to reshape it." },
    ],
  },
];

export function experienceForPath(pathname: string | null | undefined): ExperienceInfo | undefined {
  if (!pathname) return undefined;
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return EXPERIENCES.find((e) => e.route === p);
}
