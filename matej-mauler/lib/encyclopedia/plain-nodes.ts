import type { NodeDef } from "./types";

/* ── Stopařův průvodce po Galaxii ───────────────────────────────────
   Jeden z absurdních světů Absurdní encyklopedie — a její vzor.
   Vlastní větev: stoparuv-pruvodce → nepanikar → 42 → rucnik
   → babylonska-rybka → vogonska-poezie → prevazne-neskodna */

export const PLAIN_NODES: NodeDef[] = [
  {
    slug: "stoparuv-pruvodce", realm: "hitchhiker",
    title: { cs: "Stopařův průvodce po Galaxii", en: "The Hitchhiker's Guide to the Galaxy" },
    guide: {
      cs: "Nejpozoruhodnější kniha, jaká kdy vyšla. Prodává se líp než Encyklopedie Galactica, protože je o něco levnější a na obálce má velkými přátelskými písmeny napsáno NEPANIKAŘ. Tahle encyklopedie se u ní nestydatě inspiruje. Scrolluj a projdi její nejslavnější hesla.",
      en: "The most remarkable book ever published. It outsells the Encyclopedia Galactica because it's slightly cheaper and has the words DON'T PANIC inscribed in large friendly letters on its cover. This encyclopedia shamelessly takes after it. Scroll down through its most famous entries.",
    },
    up: "brana", next: "nepanikar",
    plain: { glyph: "📖" },
    satellites: [
      { to: "vesmir", x: 14, y: 30 },
      { to: "red-dwarf", x: 86, y: 30, label: { cs: "Jiná loď, jiné neštěstí", en: "Another ship, another mishap" } },
    ],
  },
  {
    slug: "nepanikar", realm: "hitchhiker",
    title: { cs: "Nepanikař", en: "Don't Panic" },
    guide: {
      cs: "Slova napsaná velkými přátelskými písmeny na obálce Průvodce. Podle Arthura C. Clarka ta nejlepší rada, jaká kdy byla lidstvu dána. Zbytek obsahu knihy je víceméně volitelný.",
      en: "The words inscribed in large friendly letters on the Guide's cover. According to Arthur C. Clarke, the best advice that could possibly be given to humanity. The rest of the book's contents are more or less optional.",
    },
    up: "stoparuv-pruvodce", next: "42",
    plain: { glyph: "NEPANIKAŘ", accent: "#3fae5a" },
  },
  {
    slug: "42", realm: "hitchhiker",
    title: { cs: "42", en: "42" },
    guide: {
      cs: "Odpověď na Velkou otázku Života, Vesmíru a Vůbec. Počítač Deep Thought ji počítal sedm a půl milionu let. Škoda jen, že nikdo přesně neví, jak zněla otázka — na tu musel být postaven počítač ještě větší: Země.",
      en: "The Answer to the Great Question of Life, the Universe and Everything. The computer Deep Thought took seven and a half million years to calculate it. Pity nobody knows exactly what the question was — an even bigger computer had to be built to work that out: the Earth.",
    },
    up: "nepanikar", next: "rucnik",
    plain: { glyph: "42" },
    satellites: [
      { to: "vesmir", x: 14, y: 30 },
      { to: "zivot", x: 86, y: 30 },
    ],
  },
  {
    slug: "rucnik", realm: "hitchhiker",
    title: { cs: "Ručník", en: "The Towel" },
    guide: {
      cs: "Zhruba nejužitečnější věc, jakou může mezihvězdný stopař mít. Má obrovskou praktickou hodnotu — a hlavně: když si nestopař všimne, že stopař ručník má, automaticky předpokládá, že má i všechno ostatní. Frasa, to je teda frajer, ten ví, kde má ručník.",
      en: "About the most massively useful thing an interstellar hitchhiker can have. Huge practical value — and crucially: when a non-hitchhiker notices a hitchhiker has their towel, they automatically assume they have everything else too. There's a frood who really knows where their towel is.",
    },
    up: "42", next: "babylonska-rybka",
    plain: { glyph: "🧣" },
    satellites: [{ to: "towelie", x: 86, y: 30, label: { cs: "Ručník, který to vzdal", en: "A towel that gave up" } }],
  },
  {
    slug: "babylonska-rybka", realm: "hitchhiker",
    title: { cs: "Babylonská rybka", en: "The Babel Fish" },
    guide: {
      cs: "Malá žlutá pijavicovitá rybka. Zasuneš si ji do ucha a okamžitě rozumíš čemukoliv v jakémkoliv jazyce. Řada teologů ji považuje za nejpádnější důkaz neexistence Boha — něco tak šíleně užitečného přece nemohlo vzniknout náhodou.",
      en: "A small, yellow, leech-like fish. Stick it in your ear and you instantly understand anything said to you in any language. Many theologians consider it the most convincing proof of the non-existence of God — something so mind-bogglingly useful could not have evolved by chance.",
    },
    up: "rucnik", next: "vogonska-poezie",
    plain: { glyph: "🐠" },
    satellites: [{ to: "jazyk", x: 86, y: 30 }],
  },
  {
    slug: "vogonska-poezie", realm: "hitchhiker",
    title: { cs: "Vogonská poezie", en: "Vogon Poetry" },
    guide: {
      cs: "Třetí nejhorší poezie ve vesmíru. Vogoni ji předčítají zajatcům jako formu mučení. Při recitálu se doporučuje nepochválit metaforiku — vede to k přídavku.",
      en: "The third worst poetry in the universe. Vogons read it to captives as a form of torture. During a recital, do not compliment the imagery — it leads to an encore.",
    },
    up: "babylonska-rybka", next: "prevazne-neskodna",
    plain: { glyph: "📜" },
    satellites: [{ to: "poezie", x: 14, y: 30 }],
  },
  {
    slug: "prevazne-neskodna", realm: "hitchhiker",
    title: { cs: "Převážně neškodná", en: "Mostly Harmless" },
    guide: {
      cs: "Kompletní heslo o planetě Zemi ve Stopařově průvodci. Původní verze zněla jen „Neškodná“ — po patnácti letech terénního výzkumu ji Ford Prefect rozšířil. Konec téhle větve. Díky za všechny ryby.",
      en: "The complete entry on planet Earth in the Hitchhiker's Guide. The original version simply read “Harmless” — after fifteen years of field research, Ford Prefect expanded it. End of this branch. So long, and thanks for all the fish.",
    },
    up: "vogonska-poezie",
    plain: { glyph: "🌍" },
    satellites: [
      { to: "zeme", x: 14, y: 30 },
      { to: "delfini", x: 86, y: 30 },
    ],
  },
];
