// Sdílené UI texty a veřejný typ songů — bez DB importů, ať se Neon driver nedostane do klientského bundlu.
export type PublicSong = {
  slug: string; title: string; note: string;
  audioUrl: string; coverUrl: string | null; date: string; likes: number;
};

export const songsUi = {
  cs: {
    back: "← Spaghetti.ltd",
    title: "Songs",
    subtitle: "Občas něco složím. Tady to zůstává.",
    intro: "Žádný velký plán, žádné album. Jen songy, co vznikly cestou.",
    all: "Všechny songy →",
    empty: "Zatím ticho. Brzy tu něco zahraje.",
    play: "Přehrát", pause: "Pauza",
    prev: "Novější", next: "Starší", volume: "Hlasitost",
    feedbackTitle: "Poslat vzkaz autorovi",
    feedbackHint: "Uvidím to jen já. Veřejně se to nezobrazí.",
    messagePh: "Tvůj vzkaz…", send: "Odeslat",
    sent: "Díky, dorazilo to ke mně. 🍝",
    of: "z",
  },
  en: {
    back: "← Spaghetti.ltd",
    title: "Songs",
    subtitle: "Sometimes I make a song. It ends up here.",
    intro: "No grand plan, no album. Just songs that happened along the way.",
    all: "All songs →",
    empty: "Silence for now. Something will play here soon.",
    play: "Play", pause: "Pause",
    prev: "Newer", next: "Older", volume: "Volume",
    feedbackTitle: "Send a message to the author",
    feedbackHint: "Only I will see this. It won't be shown publicly.",
    messagePh: "Your message…", send: "Send",
    sent: "Thanks, it reached me. 🍝",
    of: "of",
  },
} as const;
