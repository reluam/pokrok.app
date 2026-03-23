// Uživatelský profil z onboardingu
export type Gender = "male" | "female" | "other";
export type AgeGroup = "0–18" | "19–30" | "31–45" | "46–60" | "60+";

export const AGE_GROUPS: AgeGroup[] = ["0–18", "19–30", "31–45", "46–60", "60+"];

export interface LifeAreaScore {
  area: string;
  label: string;
  score: number; // 1–10
}

export interface UserProfile {
  name: string;
  age: AgeGroup;
  gender: Gender;
  lifeAreas: LifeAreaScore[];
  happiestMoment: string;
  whatFriendsSay: string;
  whatParentsSay: string;
  completedAt: number;
}

export const LIFE_AREAS: Omit<LifeAreaScore, "score">[] = [
  { area: "health", label: "Zdraví a energie" },
  { area: "family", label: "Rodina" },
  { area: "relationship", label: "Partnerský vztah" },
  { area: "friends", label: "Přátelé a sociální život" },
  { area: "career", label: "Kariéra a práce" },
  { area: "finances", label: "Finance" },
  { area: "growth", label: "Osobní rozvoj" },
  { area: "fun", label: "Zábava a odpočinek" },
];

export const USER_PROFILE_KEY = "povidej-profile";

// Typy koučovacích specializací
export type CoachingTopicId =
  | "decision-paralysis"
  | "creative-block"
  | "motivation"
  | "general";

export interface CoachingTopic {
  id: CoachingTopicId;
  title: string;
  description: string;
  icon: string;
}

// Zpráva v chatu
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

// Koučovací session
export interface CoachingSession {
  id: string;
  topicId: CoachingTopicId;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Požadavek na API
export interface ChatRequest {
  topicId: CoachingTopicId;
  messages: ChatMessage[];
  sessionId?: string;
  userProfile?: UserProfile;
}

// Odpověď z API
export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
}

// Definice všech dostupných témat
export const COACHING_TOPICS: CoachingTopic[] = [
  {
    id: "decision-paralysis",
    title: "Paralýza rozhodování",
    description:
      "Pomoc při zaseknutí před důležitým rozhodnutím. Rozkryjeme možnosti a najdeme cestu vpřed.",
    icon: "⚖️",
  },
  {
    id: "creative-block",
    title: "Kreativní blok",
    description:
      "Když přestane téct inspirace. Odblokujeme tvůrčí potenciál a najdeme nové perspektivy.",
    icon: "🎨",
  },
  {
    id: "motivation",
    title: "Ztráta motivace",
    description:
      "Vrátíme energii a smysl do každodenních aktivit. Najdeme, co tě skutečně pohání vpřed.",
    icon: "🔥",
  },
  {
    id: "general",
    title: "Koučovací sezení",
    description:
      "Klasické koučovací sezení pro hlubší práci na sobě, cílech a životních oblastech.",
    icon: "🌱",
  },
];

// Nástroje
export interface Tool {
  id: ToolId;
  title: string;
  description: string;
  icon: string;
}

export type ToolId = "decision-paralysis" | "creative-block" | "motivation";

export const TOOLS: Tool[] = [
  {
    id: "decision-paralysis",
    title: "Paralýza rozhodování",
    description: "Zorientuj se v situaci, kde se nemůžeš rozhodnout.",
    icon: "⚖️",
  },
  {
    id: "creative-block",
    title: "Kreativní blok",
    description: "Odblokuj tvůrčí energii a najdi nové perspektivy.",
    icon: "🎨",
  },
  {
    id: "motivation",
    title: "Ztráta motivace",
    description: "Reconnect s tím, co tě skutečně pohání vpřed.",
    icon: "🔥",
  },
];

export interface DecisionToolData {
  decision: string;
  options: string;
  blockers: string;
  deadline: string;
  savedAt: number;
}

export interface CreativeToolData {
  project: string;
  blockDuration: string;
  blockDescription: string;
  whatHelped: string;
  savedAt: number;
}

export interface MotivationToolData {
  area: string;
  since: string;
  previousMotivation: string;
  currentFeeling: string;
  savedAt: number;
}

export type ToolData = DecisionToolData | CreativeToolData | MotivationToolData;

export const TOOL_KEYS: Record<ToolId, string> = {
  "decision-paralysis": "povidej-tool-decision",
  "creative-block": "povidej-tool-creative",
  "motivation": "povidej-tool-motivation",
};

export const CHAT_MESSAGES_KEY = "povidej-chat-messages";
