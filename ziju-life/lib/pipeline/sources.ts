export const SOURCES = [
  // === PSYCHOLOGIE A CHOVÁNÍ ===
  {
    name: "PsyPost",
    url: "https://www.psypost.org/feed",
    type: "rss",
    category: "psychology",
    priority: "high",
  },
  {
    name: "BPS Research Digest",
    url: "https://www.bps.org.uk/research-digest/rss",
    type: "rss",
    category: "psychology",
    priority: "high",
  },
  {
    name: "Greater Good Science Center",
    url: "https://greatergood.berkeley.edu/rss/all",
    type: "rss",
    category: "psychology",
    priority: "high",
  },
  {
    name: "Behavioral Scientist",
    url: "https://behavioralscientist.org/feed/",
    type: "rss",
    category: "psychology",
    priority: "medium",
  },

  // === NEUROVĚDA ===
  {
    name: "Neuroscience News",
    url: "https://neurosciencenews.com/feed/",
    type: "rss",
    category: "neuroscience",
    priority: "high",
  },
  {
    name: "PubMed - Attention & Motivation",
    url: "https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?query=attention+motivation+neuroplasticity&sort=date",
    type: "rss",
    category: "neuroscience",
    priority: "medium",
  },

  // === ZDRAVÍ A TĚLO ===
  {
    name: "ScienceDaily - Living Well",
    url: "https://www.sciencedaily.com/rss/living_well.xml",
    type: "rss",
    category: "health",
    priority: "high",
  },
  {
    name: "Examine.com Research Feed",
    url: "https://examine.com/feed/",
    type: "rss",
    category: "health",
    priority: "high",
  },
  {
    name: "Huberman Lab Podcast",
    url: "https://feeds.megaphone.fm/hubermanlab",
    type: "podcast_rss",
    category: "health",
    priority: "high",
  },
  {
    name: "Found My Fitness (Rhonda Patrick)",
    url: "https://feeds.megaphone.fm/foundmyfitness",
    type: "podcast_rss",
    category: "health",
    priority: "medium",
  },
  {
    name: "Peter Attia - The Drive",
    url: "https://peterattia.com/feed/",
    type: "rss",
    category: "health",
    priority: "medium",
  },

  // === PRODUKTIVITA A ČAS ===
  {
    name: "Cal Newport Blog",
    url: "https://calnewport.com/feed/",
    type: "rss",
    category: "productivity",
    priority: "high",
  },
  {
    name: "Ness Labs",
    url: "https://nesslabs.com/feed",
    type: "rss",
    category: "productivity",
    priority: "medium",
  },
  {
    name: "Farnam Street",
    url: "https://fs.blog/feed/",
    type: "rss",
    category: "productivity",
    priority: "high",
  },

  // === MINDFULNESS A VĚDOMÉ ŽITÍ ===
  {
    name: "Mindful.org",
    url: "https://www.mindful.org/feed/",
    type: "rss",
    category: "mindfulness",
    priority: "high",
  },
  {
    name: "Tricycle",
    url: "https://tricycle.org/feed/",
    type: "rss",
    category: "mindfulness",
    priority: "medium",
  },
  {
    name: "PubMed - Mindfulness Research",
    url: "https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?query=mindfulness+meditation+well-being&sort=date",
    type: "rss",
    category: "mindfulness",
    priority: "medium",
  },

  // === VZTAHY A SOCIÁLNÍ DYNAMIKA ===
  {
    name: "The Gottman Institute Blog",
    url: "https://www.gottman.com/blog/feed/",
    type: "rss",
    category: "relationships",
    priority: "medium",
  },

  // === OBECNÉ - VĚDA O ŽITÍ ===
  {
    name: "The Conversation - Health",
    url: "https://theconversation.com/us/health/articles.atom",
    type: "rss",
    category: "health",
    priority: "medium",
  },
  {
    name: "Aeon Essays",
    url: "https://aeon.co/feed.rss",
    type: "rss",
    category: "psychology",
    priority: "medium",
  },
] as const;

export type SourceType = (typeof SOURCES)[number]["type"];
export type CategoryKey = (typeof SOURCES)[number]["category"];

export const CATEGORIES = {
  psychology: {
    label: "Psychologie a chování",
    emoji: "🧠",
    description: "Návyky, rozhodování, emoce, behaviorální věda",
  },
  neuroscience: {
    label: "Neurověda",
    emoji: "⚡",
    description: "Mozek, pozornost, motivace, neuroplasticita",
  },
  health: {
    label: "Zdraví a tělo",
    emoji: "💪",
    description: "Spánek, výživa, pohyb, longevity",
  },
  productivity: {
    label: "Produktivita",
    emoji: "⏰",
    description: "Práce s časem, focus, deep work",
  },
  mindfulness: {
    label: "Mindfulness",
    emoji: "🧘",
    description: "Vědomé žití, meditace, přítomnost",
  },
  relationships: {
    label: "Vztahy",
    emoji: "🤝",
    description: "Sociální dynamika, komunikace, connection",
  },
} as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  psychology: "🧠",
  neuroscience: "⚡",
  health: "💪",
  productivity: "⏰",
  mindfulness: "🧘",
  relationships: "🤝",
};
