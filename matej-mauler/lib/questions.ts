export type Option = { id: string; label: string; emoji: string; note?: string };
export type Question = { id: string; text: string; subtext?: string; type: "select"; options: Option[] };
export type Duration = { display: string; seconds?: number; headline: string };
export type Answers = Record<string, string>;
export type CalcResult = { duration: Duration; funnyNotes: string[] };

/* ── Czech questions ──────────────────────────────────────────── */

const questionsCs: Question[] = [
  {
    id: "origin", text: "Odkud vlastně pocházíš?", type: "select",
    options: [
      { id: "druhohoryCzech", label: "Z druhohor",                    emoji: "🦕", note: "Gratuluji k přežití." },
      { id: "rim",            label: "Ze starého Říma",               emoji: "🏛️" },
      { id: "stredovek",      label: "Ze Středověku",                 emoji: "🧙" },
      { id: "budoucnost",     label: "Z budoucnosti (rok 2387)",      emoji: "🚀", note: "Tak jak to vypadá?" },
      { id: "atlantis",       label: "Z Atlantidy",                   emoji: "🌊" },
      { id: "bublina",        label: "Jsem bublina. Ještě neexistuji.", emoji: "🫧" },
    ],
  },
  {
    id: "fuel", text: "Co tě pohání?", type: "select",
    options: [
      { id: "kofein",   label: "Kofein a věčná naděje",          emoji: "☕" },
      { id: "chaos",    label: "Čistá chaos energie",             emoji: "🌀" },
      { id: "hruza",    label: "Existenciální hrůza",             emoji: "💀", note: "Efektivní palivo." },
      { id: "pizza",    label: "Výhradně pizza",                  emoji: "🍕" },
      { id: "kachny",   label: "Vztek z kachen",                  emoji: "🦆" },
      { id: "solarni",  label: "Sluneční energie (jsem panel)",   emoji: "⚡" },
    ],
  },
  {
    id: "hobby", text: "Jak trávíš volný čas?", type: "select",
    options: [
      { id: "smysl",       label: "Hledám smysl v YouTube komentářích",  emoji: "🕳️" },
      { id: "kachny2",     label: "Krmím kachny a řeším existenci",      emoji: "🦆" },
      { id: "teleport",    label: "Teleportuji se (jen v místnosti)",    emoji: "✨" },
      { id: "kryo",        label: "Hibernuji v kryokapsli",              emoji: "🧊", note: "Efektivní strategie." },
      { id: "powerpoint",  label: "Tvořím PowerPoint o PowerPointu",    emoji: "📊" },
      { id: "scroll",      label: "Scrolluji do nicoty",                 emoji: "📱" },
    ],
  },
  {
    id: "goal", text: "Tvůj životní cíl?", type: "select",
    options: [
      { id: "zalozky",     label: "Přečíst všechny záložky v prohlížeči",      emoji: "🌈" },
      { id: "oprava",      label: "Konečně opravit tu jednu věc doma",         emoji: "🔧" },
      { id: "inbox",       label: "Inbox na nulu", emoji: "📭", note: "Bylo to možné jednou. Rok 2014." },
      { id: "motylek",     label: "Stát se motýlem",                           emoji: "🦋" },
      { id: "singularita", label: "Přežít AI singularitu",                     emoji: "🤖" },
      { id: "nesmrtelnost",label: "Nesmrtelnost (nebo aspoň dobrý spánek)",   emoji: "💤" },
    ],
  },
  {
    id: "fear", text: "Čeho se (tajně) nejvíce bojíš?", type: "select",
    options: [
      { id: "kachny3",  label: "Kachen. Jsou divné.",                       emoji: "🦆" },
      { id: "pondeli",  label: "Pohledu do zrcadla v pondělí ráno",         emoji: "🪞" },
      { id: "ticho",    label: "Ticha v hovoru delšího než 3 vteřiny",      emoji: "😶" },
      { id: "vecnost",  label: "Věčnosti",                                  emoji: "♾️" },
      { id: "perlivka", label: "Perlivé vody bez bublin",                   emoji: "🫧" },
      { id: "pravda",   label: "Že přijdu pozdě a budu mít přesto pravdu",  emoji: "⏱️" },
    ],
  },
];

/* ── English questions ─────────────────────────────────────────── */

const questionsEn: Question[] = [
  {
    id: "origin", text: "Where do you actually come from?", type: "select",
    options: [
      { id: "druhohoryCzech", label: "The Cretaceous period",         emoji: "🦕", note: "Congratulations on surviving." },
      { id: "rim",            label: "Ancient Rome",                  emoji: "🏛️" },
      { id: "stredovek",      label: "The Middle Ages",              emoji: "🧙" },
      { id: "budoucnost",     label: "The future (year 2387)",        emoji: "🚀", note: "So how does it look?" },
      { id: "atlantis",       label: "Atlantis",                      emoji: "🌊" },
      { id: "bublina",        label: "I'm a bubble. Don't exist yet.", emoji: "🫧" },
    ],
  },
  {
    id: "fuel", text: "What powers you?", type: "select",
    options: [
      { id: "kofein",   label: "Caffeine and eternal hope",        emoji: "☕" },
      { id: "chaos",    label: "Pure chaos energy",                emoji: "🌀" },
      { id: "hruza",    label: "Existential dread",                emoji: "💀", note: "Efficient fuel." },
      { id: "pizza",    label: "Pizza. Exclusively.",              emoji: "🍕" },
      { id: "kachny",   label: "Rage at ducks",                    emoji: "🦆" },
      { id: "solarni",  label: "Solar energy (I'm a panel)",       emoji: "⚡" },
    ],
  },
  {
    id: "hobby", text: "How do you spend free time?", type: "select",
    options: [
      { id: "smysl",       label: "Searching for meaning in YouTube comments", emoji: "🕳️" },
      { id: "kachny2",     label: "Feeding ducks and solving existence",       emoji: "🦆" },
      { id: "teleport",    label: "Teleporting (only within the room)",       emoji: "✨" },
      { id: "kryo",        label: "Hibernating in a cryo-pod",               emoji: "🧊", note: "Efficient strategy." },
      { id: "powerpoint",  label: "Making PowerPoint about PowerPoint",      emoji: "📊" },
      { id: "scroll",      label: "Scrolling into the void",                  emoji: "📱" },
    ],
  },
  {
    id: "goal", text: "Your life goal?", type: "select",
    options: [
      { id: "zalozky",     label: "Read all browser bookmarks",           emoji: "🌈" },
      { id: "oprava",      label: "Finally fix that one thing at home",   emoji: "🔧" },
      { id: "inbox",       label: "Inbox zero", emoji: "📭", note: "It was possible once. Year 2014." },
      { id: "motylek",     label: "Become a butterfly",                   emoji: "🦋" },
      { id: "singularita", label: "Survive the AI singularity",           emoji: "🤖" },
      { id: "nesmrtelnost",label: "Immortality (or just a good sleep)",  emoji: "💤" },
    ],
  },
  {
    id: "fear", text: "What do you (secretly) fear most?", type: "select",
    options: [
      { id: "kachny3",  label: "Ducks. They're weird.",                    emoji: "🦆" },
      { id: "pondeli",  label: "Looking in the mirror on Monday morning",  emoji: "🪞" },
      { id: "ticho",    label: "Silence in a conversation over 3 seconds", emoji: "😶" },
      { id: "vecnost",  label: "Eternity",                                 emoji: "♾️" },
      { id: "perlivka", label: "Sparkling water without bubbles",          emoji: "🫧" },
      { id: "pravda",   label: "Being late and still being right",         emoji: "⏱️" },
    ],
  },
];

export function getQuestions(lang: "cs" | "en"): Question[] {
  return lang === "en" ? questionsEn : questionsCs;
}

/* ── UI strings ─────────────────────────────────────────────────── */

export const calcUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Životní kalkulačka",
    title: "Kolik ti zbývá?",
    intro: "Pár otázek. Jeden výsledek. Trochu filozofie a trochu absurdity.",
    start: "Začít →",
    resultLabel: "Výsledek výpočtu",
    seconds: "vteřin",
    expiredTitle: "Čas vypršel.",
    expiredSub: "A přesto jsi stále tady. Zvláštní.",
    notesLabel: "Faktory výpočtu",
    disclaimer: "Výpočet byl proveden s veškerou dostupnou péčí a absolutně žádnou vědeckou přesností.",
    retry: "Zkusit znovu →",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Life calculator",
    title: "How much do you have left?",
    intro: "A few questions. One result. A little philosophy and a little absurdity.",
    start: "Start →",
    resultLabel: "Calculation result",
    seconds: "seconds",
    expiredTitle: "Time's up.",
    expiredSub: "And yet you're still here. Strange.",
    notesLabel: "Calculation factors",
    disclaimer: "This calculation was performed with all available care and absolutely no scientific accuracy.",
    retry: "Try again →",
  },
} as const;

/* ── Durations ──────────────────────────────────────────────────── */

const durationsCs: Duration[] = [
  { seconds: 17,  display: "17 vteřin",          headline: "Stihneš jeden zhluboka nadechnout." },
  { seconds: 43,  display: "43 vteřin",          headline: "Dost na jednu dobrou myšlenku." },
  { seconds: 73,  display: "73 vteřin",          headline: "Víc než dost. Využij to moudře." },
  { seconds: 119, display: "1 minutu 59 vteřin", headline: "Téměř dvě minuty. To je luxus." },
  { display: "42 minut",         headline: "Klasická délka dobrého seriálového dílu. Nebo jedné schůzky." },
  { display: "847 let",          headline: "Za tu dobu padlo pár říší. Ty pořád jedeš." },
  { display: "2 546 let",        headline: "Plato byl mrtvý 2 300 let. Stále ho čteme." },
  { display: "10 000 let",       headline: "Za 10 000 let bude to, co teď čteš, mrtvý jazyk." },
  { display: "3,2 miliardy let", headline: "Zhruba stejně jako trvala evoluce od bakterie k tobě." },
  { display: "věčnost (±15 %)",  headline: "Přesnost výpočtu závisí na definici věčnosti." },
];

const durationsEn: Duration[] = [
  { seconds: 17,  display: "17 seconds",             headline: "Enough for one deep breath." },
  { seconds: 43,  display: "43 seconds",             headline: "Enough for one good thought." },
  { seconds: 73,  display: "73 seconds",             headline: "More than enough. Use it wisely." },
  { seconds: 119, display: "1 minute and 59 seconds",headline: "Almost two minutes. That's luxury." },
  { display: "42 minutes",          headline: "Classic length of a good TV episode. Or one meeting." },
  { display: "847 years",           headline: "A few empires will fall in that time. You'll still be going." },
  { display: "2,546 years",         headline: "Plato died 2,300 years ago. We still read him." },
  { display: "10,000 years",        headline: "In 10,000 years, what you're reading now will be a dead language." },
  { display: "3.2 billion years",   headline: "About the same as it took evolution from bacteria to you." },
  { display: "eternity (±15%)",     headline: "Accuracy of calculation depends on the definition of eternity." },
];

/* ── Funny notes ────────────────────────────────────────────────── */

const funnyNotesCs: Record<string, string> = {
  druhohoryCzech: "Technicky jsi přežil/a pět velkých vymírání. Imponující.",
  rim:            "Římanům trvalo 1 000 let, než uznali, že přehánějí s akvedukty.",
  stredovek:      "Průměrná délka středověkého života: 35 let. Ty to zvládneš líp.",
  budoucnost:     "Pokud víš, co se stane, proč jsi tu? Investuj.",
  atlantis:       "Atlantida zmizela před 11 600 lety. Ty vypadáš skvěle.",
  bublina:        "Bubliny existují průměrně 1–2 vteřiny. Filosoficky vzato — jsme všichni bubliny.",
  kofein:         "Kofein blokuje adenosin. Efektivita: 94 %. Závislost: 100 %.",
  chaos:          "Entropie vesmíru roste. Jsi v souladu s přírodou.",
  hruza:          "Existenciální hrůza zvyšuje bdělost o 23 %. Ověřeno.",
  pizza:          "Pizza jako palivo prodlužuje chuť k životu, ne délku života.",
  kachny:         "Kachny žijí průměrně 20 let. Stále je respektuj.",
  solarni:        "V noci tedy máš výpadky. Chápu.",
  smysl:          "YouTube komentáře jsou nejrychlejší způsob, jak ztratit víru v lidstvo.",
  kachny2:        "Kachny vědí víc, než dávají najevo. Moudrá metoda výzkumu.",
  teleport:       "Teleportace v rámci místnosti šetří energii o 0,003 %. Žádné vedlejší účinky.",
  kryo:           "Kryogenické zmrazení prodlužuje technicky neomezeně. Gratulujeme.",
  powerpoint:     "PowerPoint byl vytvořen v roce 1987 a stále přežívá. Inspirativní.",
  scroll:         "Průměrný člověk přescrolluje 300 metrů obsahu denně. Ty pravděpodobně víc.",
  zalozky:        "Průměrný člověk má 47 záložek, které 'určitě jednou přečte'. Šťastnou cestu.",
  oprava:         "Ta věc čeká. Pořád čeká. A čekáním si buduje charakter.",
  inbox:          "Inbox zero bylo dosaženo jednou. V roce 2014. Nikdo neví kdo.",
  motylek:        "Biologicky vzato: obtížné. Metaforicky: krásné.",
  singularita:    "Pokud AI přebere vládu, budeš přinejmenším zajímavý exponát.",
  nesmrtelnost:   "Dobrý spánek prodlužuje život o 7 let. Nesmrtelnost o víc.",
  kachny3:        "Kachny jsou opravdu divné. Máš pravdu. Nikdo to neřeší dost.",
  pondeli:        "Pondělní zrcadlo je statisticky nejhorší zrcadlo celého týdne.",
  ticho:          "3 vteřiny ticha v hovoru = 3 hodiny přemýšlení, co říct.",
  vecnost:        "Správná volba. Věčnost je opravdu děsivá.",
  perlivka:       "Bez bublin je to jen voda. Bez bublin jsme jen hmota.",
  pravda:         "Přijít pozdě a mít pravdu — nejhorší sociální kombinace.",
};

const funnyNotesEn: Record<string, string> = {
  druhohoryCzech: "You've technically survived five mass extinctions. Impressive.",
  rim:            "It took the Romans 1,000 years to admit they overdid the aqueducts.",
  stredovek:      "Average medieval lifespan: 35 years. You'll do better.",
  budoucnost:     "If you know what happens, why are you here? Invest.",
  atlantis:       "Atlantis disappeared 11,600 years ago. You look great.",
  bublina:        "Bubbles exist for 1–2 seconds on average. Philosophically, we're all bubbles.",
  kofein:         "Caffeine blocks adenosine. Effectiveness: 94%. Dependency: 100%.",
  chaos:          "The entropy of the universe grows. You're in harmony with nature.",
  hruza:          "Existential dread increases alertness by 23%. Verified.",
  pizza:          "Pizza as fuel extends your will to live, not your life.",
  kachny:         "Ducks live about 20 years on average. Still respect them.",
  solarni:        "At night you have outages then. I understand.",
  smysl:          "YouTube comments are the fastest way to lose faith in humanity.",
  kachny2:        "Ducks know more than they let on. Smart research method.",
  teleport:       "In-room teleportation saves energy by 0.003%. No side effects.",
  kryo:           "Cryogenic freezing technically extends indefinitely. Congratulations.",
  powerpoint:     "PowerPoint was created in 1987 and still survives. Inspiring.",
  scroll:         "The average person scrolls 300 meters of content daily. You probably more.",
  zalozky:        "The average person has 47 bookmarks they'll 'read one day'. Godspeed.",
  oprava:         "That thing is waiting. Still waiting. Building character while it waits.",
  inbox:          "Inbox zero was achieved once. In 2014. Nobody knows who.",
  motylek:        "Biologically: difficult. Metaphorically: beautiful.",
  singularita:    "If AI takes over, you'll at least be an interesting exhibit.",
  nesmrtelnost:   "A good night's sleep adds 7 years. Immortality adds more.",
  kachny3:        "Ducks are really weird. You're right. Nobody addresses this enough.",
  pondeli:        "Monday's mirror is statistically the worst mirror of the week.",
  ticho:          "3 seconds of silence in a conversation = 3 hours thinking what to say.",
  vecnost:        "Correct choice. Eternity is truly terrifying.",
  perlivka:       "Without bubbles it's just water. Without bubbles we're just matter.",
  pravda:         "Being late and still being right — the worst social combination.",
};

/* ── Calculation ─────────────────────────────────────────────────── */

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
}

export function calculateResult(answers: Answers, lang: "cs" | "en" = "cs"): CalcResult {
  const combined = Object.values(answers).sort().join("|");
  const durations = lang === "en" ? durationsEn : durationsCs;
  const idx = hashString(combined) % durations.length;
  const duration = durations[idx];
  const notes = lang === "en" ? funnyNotesEn : funnyNotesCs;
  const funnyNotes = Object.values(answers).map(id => notes[id]).filter(Boolean) as string[];
  return { duration, funnyNotes };
}
