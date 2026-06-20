// Registr experiencí pro pravý panel (ExperiencePanelMount mapuje pathname → tohle).
// Client-safe: žádné DB importy. slug = klíč vlákna komentářů + hodnocení (stabilní, neměnit).

export type ExperienceInfo = {
  route: string; // přesný pathname, např. "/sound"
  slug: string; // klíč pro comments/ratings
  title: string;
  category?: string;
  description?: string;
  guide?: string[]; // volitelný návod, krok = položka
};

export const EXPERIENCES: ExperienceInfo[] = [
  {
    route: "/life-manual",
    slug: "life-manual",
    title: "Life Manual",
    category: "guide",
    description: "A guide to life in the style of an IKEA assembly manual — black-and-white technical sheets. Funny, instructive and true.",
    guide: [
      "Move between sheets by scrolling or using the arrow keys.",
      "Each numbered sheet is one assembly step for life — read it like an IKEA manual.",
      "It's deadpan black & white on purpose; the jokes are load-bearing.",
      "Reading is free — sign in only to comment or rate.",
    ],
  },
  {
    route: "/encyclopedia",
    slug: "encyclopedia",
    title: "The Encyclopedia",
    category: "wiki",
    description: "An interactive encyclopedia connected by noodles of knowledge. Scroll from the general to the specific, click sideways.",
    guide: [
      "Scroll down to go deeper — from the general to the specific.",
      "Click sideways to take a detour into a related topic.",
      "Red links are uncharted; wish for them and they may get written.",
    ],
  },
  {
    route: "/sound",
    slug: "sound",
    title: "A journey along a sound wave",
    category: "audio",
    description: "An interactive sound experience: your cursor is an ear. Scroll through sound from a tremble through frequency and timbre to an echo.",
    guide: [
      "Your cursor is an ear — move it to listen.",
      "Scroll to travel along the wave: tremble → frequency → timbre → echo.",
      "Headphones strongly recommended.",
    ],
  },
  {
    route: "/music",
    slug: "music",
    title: "How music is made",
    category: "audio",
    description: "Interactive music studio: build a track layer by layer — beat, bass, chords and melody. Grids, faders and effects like in a DAW.",
    guide: [
      "Build a track layer by layer: beat, bass, chords, melody.",
      "Tap grid cells to place notes; drag faders to mix.",
      "Add effects like in a DAW, then hit play.",
    ],
  },
  {
    route: "/radio",
    slug: "radio",
    title: "Radio",
    category: "audio",
    description: "Server-rendered radio: an endless mastered track that listeners tune every 15 seconds by voting — melody, beat, bass, instrument, tempo, key.",
    guide: [
      "One endless track everyone tunes together.",
      "Every 15 seconds, vote to nudge melody, beat, bass, tempo or key.",
      "Or just leave it on and listen.",
    ],
  },
  {
    route: "/synapsis",
    slug: "synapsis",
    title: "Synapse",
    category: "mind",
    description: "Word → association. Every answer strengthens a synapse in the internet's shared network. Explorer adds associations, Researcher explores the map.",
    guide: [
      "Type the first word that comes to mind.",
      "Each answer strengthens a synapse in a shared network.",
      "Switch between Explorer (add) and Researcher (browse the map).",
    ],
  },
  {
    route: "/decision-maker",
    slug: "decision-maker",
    title: "Decision Maker",
    category: "tool",
    description: "A tool for deciding when you're stuck at 50/50. Pros and cons with weights, a physical tug-of-war and the moment of cutting off (decidere).",
    guide: [
      "List the pros and cons, give each a weight.",
      "Watch the tug-of-war tilt toward a side.",
      "Cut it off to decide — decidere means 'to cut off'.",
    ],
  },
  {
    route: "/vvv",
    slug: "vvv",
    title: "VVV — Vast Void Vault",
    category: "wiki",
    description: "An encyclopedia more complete than the Hitchhiker's Guide to the Galaxy.",
    guide: [
      "Browse a vault aiming to be more complete than the Hitchhiker's Guide.",
      "Wander the entries and follow whatever catches your eye.",
    ],
  },

  {
    route: "/hymna",
    slug: "hymna",
    title: "The anthem of your life",
    category: "audio",
    description: "Answer a handful of questions and it composes — and plays — a personal anthem for your life: brass, organ, bass and drums, arranged from your answers.",
    guide: [
      "Answer the questions about your life and how you want it to feel.",
      "From your answers it arranges a full anthem — brass, organ, bass, drums.",
      "Press play and stand up straight. Headphones recommended.",
    ],
  },
  {
    route: "/jak-to-zni",
    slug: "jak-to-zni",
    title: "How does it sound?",
    category: "audio",
    description: "Type any text and hear it turned into sound — each character becomes a note. The same words sound wildly different depending on the waveform.",
    guide: [
      "Type any text — a word, a name, a whole sentence.",
      "It's mapped to notes and played back; watch each character light up.",
      "Switch the waveform or try a preset to change the character of the sound.",
    ],
  },
  {
    route: "/journey",
    slug: "journey",
    title: "The Journey",
    category: "story",
    description: "A horizontal scrollytelling: scrolling walks a little being across the whole picture of a life, stage by stage, with a few words at each stop.",
    guide: [
      "Scroll down — your scrolling walks the being forward across life.",
      "The background shifts colour with each stage; text appears at each stop.",
      "Go slow. It's a walk, not a race.",
    ],
  },
  {
    route: "/time-remaining",
    slug: "time-remaining",
    title: "Time Remaining",
    category: "tool",
    description: "Answer a few honest questions and see an estimate of the time you have left — made tangible, so you might spend it a little better.",
    guide: [
      "Tap through a handful of questions about your life and habits.",
      "At the end you get an estimate of your time remaining.",
      "It's a nudge, not a prophecy — let it land, then go live.",
    ],
  },
  {
    route: "/what-are-the-odds",
    slug: "what-are-the-odds",
    title: "What are the odds?",
    category: "tool",
    description: "Surprising probabilities put in perspective — the real odds of everyday and extraordinary things. Roll for a new one or pick from the list.",
    guide: [
      "Read the scenario and guess the odds before they're revealed.",
      "Hit roll for a fresh, random scenario.",
      "Or pick a specific one from the list.",
    ],
  },
  {
    route: "/sound-foundry",
    slug: "sound-foundry",
    title: "Sound Foundry",
    category: "audio",
    description: "Forge a sound out of words: search ingredient-words (a sound family plus modifiers), stack them, and the foundry synthesises and plays the result.",
    guide: [
      "Search words and add a sound family (the base) plus a few modifiers.",
      "The foundry builds and plays a sound from your combination.",
      "Re-roll for a new variation, or swap words to reshape it.",
    ],
  },
];

export function experienceForPath(pathname: string | null | undefined): ExperienceInfo | undefined {
  if (!pathname) return undefined;
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return EXPERIENCES.find((e) => e.route === p);
}
