// ── Tool type ────────────────────────────────────────────────────────────────

export type ToolType = "knowledge" | "interactive";

// Map component_id → dashboard tab id for interactive tools
export const INTERACTIVE_TOOL_TABS: Record<string, string> = {
  kompas: "tvuj-kompas",
  hodnoty: "moje-hodnoty",
  "nastav-si-den": "nastav-si-den",
};

// ── Source types ──────────────────────────────────────────────────────────────

export type ToolSourceType = "book" | "article" | "video" | "research" | "podcast" | "course";

export interface ToolSource {
  type: ToolSourceType;
  title: string;
  author?: string;
  url?: string;
  note?: string;
}

// ── Categories ───────────────────────────────────────────────────────────────

export const TOOLBOX_CATEGORIES = [
  { id: "rozhodovani",  label: "Rozhodování",       icon: "🎯" },
  { id: "planovani",    label: "Plánování",         icon: "📋" },
  { id: "reflexe",      label: "Reflexe",           icon: "🪞" },
  { id: "komunikace",   label: "Komunikace",        icon: "💬" },
  { id: "mysleni",      label: "Myšlení & mindset", icon: "🧠" },
  { id: "navyky",       label: "Návyky & systémy",  icon: "🔗" },
  { id: "emoce",        label: "Emoce & stres",     icon: "🌊" },
  { id: "produktivita", label: "Produktivita",       icon: "⚡" },
  { id: "kreativita",   label: "Kreativita",        icon: "🎨" },
  { id: "vztahy",       label: "Vztahy & empatie",  icon: "🤝" },
] as const;

export type ToolboxCategoryId = (typeof TOOLBOX_CATEGORIES)[number]["id"];

// ── Tool types ───────────────────────────────────────────────────────────────

export interface ToolboxToolInput {
  slug: string;
  title: string;
  shortDescription: string;
  descriptionMarkdown: string;
  applicationMarkdown: string;
  sources?: ToolSource[];
  tags?: string[];
  category?: string;
  difficulty?: number;
  durationEstimate?: string;
  icon?: string;
  orderIndex?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  relatedToolIds?: string[];
  toolType?: ToolType;
  componentId?: string | null;
}

export interface ToolboxTool extends ToolboxToolInput {
  id: string;
  sources: ToolSource[];
  tags: string[];
  orderIndex: number;
  isActive: boolean;
  isFeatured: boolean;
  relatedToolIds: string[];
  toolType: ToolType;
  componentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Card-level type (omits heavy markdown columns for gallery queries)
export interface ToolboxToolCard {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string | null;
  tags: string[];
  difficulty: number | null;
  durationEstimate: string | null;
  icon: string | null;
  isFeatured: boolean;
  orderIndex: number;
  toolType: ToolType;
  componentId: string | null;
}
