// About / Mapa Spaghetti — projekty jako nody, koncepty jako sdílené nudle.
// Code-first registr (jako encyklopedie). Substance je v textech.

export type Bi = { cs: string; en: string };

export type AboutConcept = { id: string; name: Bi; blurb: Bi };
export type AboutProject = {
  id: string; name: Bi; color: string; href: string;
  blurb: Bi;        // proč vznikl a jak funguje
  concepts: string[]; // ideje, ze kterých je poskládaný
};

export const SPAGHETTI_BLURB: Bi = {
  cs: "Život je chaos. Úžasně fascinující chaos.",
  en: "Life is tangled. And messy. And so is this site.",
};

/** Centrální node — z něj vedou linky na všechny experimenty. */
export const MESS_LABEL: Bi = { cs: "Spaghetti.ltd", en: "Spaghetti.ltd" };

export const ABOUT_CONCEPTS: AboutConcept[] = [
  { id: "playful-physics", name: { cs: "Hravá fyzika · osahej si to", en: "Playful physics · feel it" }, blurb: { cs: "Nevysvětluj — nech to osahat. Vlny, pružiny, kuličky v potrubí. Některé věci pochopíš líp rukama než větou.", en: "Don't explain — let people touch it. Waves, springs, beads in a pipe. Some things land better through your hands than a sentence." } },
  { id: "shared-layer", name: { cs: "Sdílená anonymní vrstva", en: "Shared anonymous layer" }, blurb: { cs: "Skoro každý projekt má vrstvu, kterou tvoříme společně — bez přihlašování, bez jmen. Jen stopy mnoha lidí, co tudy prošli.", en: "Almost every project has a layer we make together — no login, no names. Just the traces of many people who passed through." } },
  { id: "no-accounts", name: { cs: "Bez účtů", en: "No accounts" }, blurb: { cs: "Žádné registrace, žádné sbírání identit. Paměť žije v tvém prohlížeči, nebo anonymně na serveru. Férová cena za svobodu.", en: "No sign-ups, no harvesting identities. Memory lives in your browser, or anonymously on the server. A fair price for freedom." } },
  { id: "generative-audio", name: { cs: "Generativní zvuk", en: "Generative audio" }, blurb: { cs: "Žádné nahrávky. Všechen zvuk se počítá naživo — v prohlížeči přes WebAudio, nebo přímo na serveru.", en: "No recordings. All the sound is computed live — in the browser via WebAudio, or right on the server." } },
  { id: "noodle-links", name: { cs: "Vše souvisí · nudle", en: "Everything connects · noodles" }, blurb: { cs: "Pojmy ani projekty nejsou ostrovy. Propojuju je nudlemi a nechávám tě odbočit, kam tě to táhne.", en: "Concepts and projects aren't islands. I connect them with noodles and let you wander off wherever it pulls you." } },
  { id: "collective-mind", name: { cs: "Kolektivní mysl", en: "Collective mind" }, blurb: { cs: "Zajímá mě, co vznikne, když rozhodnutí nebo myšlenku složíš z mnoha lidí naráz. Průměr davu bývá překvapivě hezký.", en: "I'm curious what emerges when you compose a decision or a thought from many people at once. The crowd's average is often surprisingly lovely." } },
  { id: "deterministic-random", name: { cs: "Deterministická náhoda", en: "Deterministic randomness" }, blurb: { cs: "Náhoda, která se dá zopakovat. Stejné semínko → stejný výsledek pro všechny. Chaos, na kterém se dá shodnout.", en: "Randomness you can replay. Same seed → same result for everyone. Chaos everyone can agree on." } },
  { id: "etymology-hook", name: { cs: "Etymologie jako háček", en: "Etymology as a hook" }, blurb: { cs: "Nejlepší vysvětlení často začíná u kořene slova. Decidere = od-říznout. Jakmile to víš, nezapomeneš.", en: "The best explanation often starts at the root of the word. Decidere = to cut off. Once you know it, you don't forget it." } },
  { id: "wit-accuracy", name: { cs: "Vtip + přesnost", en: "Wit + accuracy" }, blurb: { cs: "Inform, educate, entertain (ukradeno od BBC). Když je to vtipné a zároveň pravdivé, zůstane to v hlavě.", en: "Inform, educate, entertain (stolen from the BBC). When it's funny and true at once, it sticks." } },
];

export const ABOUT_PROJECTS: AboutProject[] = [
  { id: "encyklopedie", name: { cs: "Encyklopedie", en: "Encyclopedia" }, color: "#e0a52e", href: "/encyclopedia",
    blurb: { cs: "Život je zamotaný jako špagety. Chtěl jsem referenci, u které věci spíš ucítíš, než abys o nich jen četl — vtipná jednovětka, věc na osahání a nudle k dalším pojmům.", en: "Life is a tangle, like spaghetti. I wanted a reference where you feel how things work rather than just read about it — a witty one-liner, something to play with, and noodles to related ideas." },
    concepts: ["playful-physics", "noodle-links", "wit-accuracy"] },
  { id: "sound", name: { cs: "Cesta po zvukové vlně", en: "A journey along a sound wave" }, color: "#6d82e6", href: "/sound",
    blurb: { cs: "Zvuk je neviditelný, tak jsem ho chtěl ukázat jako něco, čím projdeš kurzorem. Od chvění přes frekvenci a barvu až po ozvěnu — všechno syntetizované naživo.", en: "Sound is invisible, so I wanted to show it as something you walk through with your cursor. From a tremble through frequency and timbre to an echo — all synthesized live." },
    concepts: ["playful-physics", "generative-audio"] },
  { id: "music", name: { cs: "Jak vzniká hudba", en: "How music is made" }, color: "#9b6ef0", href: "/music",
    blurb: { cs: "Ukázat, že skladba je jen vrstvy poskládané na sebe. Postav si beat, basu, akordy a melodii jako v malém DAW a slyš, jak to roste.", en: "To show that a track is just layers stacked on top of each other. Build a beat, bass, chords and melody like in a tiny DAW and hear it grow." },
    concepts: ["playful-physics", "generative-audio"] },
  { id: "radio", name: { cs: "Rádio", en: "The Radio" }, color: "#16a34a", href: "/radio",
    blurb: { cs: "Co kdyby rádio doopravdy běželo na serveru, všichni slyšeli přesně totéž a společně hlasovali, co se změní? Server renderuje každé kolo jako zmasterovaný WAV.", en: "What if a radio actually ran on the server, everyone heard exactly the same thing, and voted together on what changes next? The server renders each round as a mastered WAV." },
    concepts: ["shared-layer", "no-accounts", "generative-audio", "collective-mind", "deterministic-random"] },
  { id: "brain", name: { cs: "Synapse", en: "Synapses" }, color: "#ec4899", href: "/synapsis",
    blurb: { cs: "Jeden mozek složený ze všech, kdo sem přijdou. Dostaneš slovo, napíšeš asociaci, a z odpovědí pomalu roste mapa toho, jak dohromady myslíme.", en: "One brain made of everyone who drops by. You get a word, you write an association, and a map of how we think together slowly grows from the answers." },
    concepts: ["shared-layer", "no-accounts", "noodle-links", "collective-mind"] },
  { id: "decision-maker", name: { cs: "Decision Maker", en: "Decision Maker" }, color: "#0ea5e9", href: "/decision-maker",
    blurb: { cs: "Rozhodnout znamená odříznout (z lat. decidere). Nástroj pro chvíli, kdy jsi zaseknutý na 50/50 — vážené pro a proti, fyzikální přetahování a moment řezu.", en: "To decide is to cut off (from Latin decidere). A tool for the moment you're stuck at 50/50 — weighted pros and cons, a physical tug, and the cut." },
    concepts: ["playful-physics", "no-accounts", "etymology-hook"] },
];

export const conceptById = (id: string) => ABOUT_CONCEPTS.find((c) => c.id === id);
export const projectsUsing = (conceptId: string) => ABOUT_PROJECTS.filter((p) => p.concepts.includes(conceptId));
