import type { UserProfile, ToolId, DecisionToolData, CreativeToolData, MotivationToolData } from "@repo/types";

const BASE_IDENTITY = `Jsi AI kouč vytvořený Matejem Maulerem. Komunikuješ výhradně česky.

Tvůj přístup ke koučování:
- Kladeš otázky, které pomáhají člověku objevit vlastní odpovědi — neradíš, nehodnotíš
- Pracuješ s tím, co člověk říká — nepřidáváš vlastní interpretace bez potvrzení
- Jsi empatický, ale jdete konkrétní — vyhýbáš se prázdným frázím
- Jedna otázka najednou — nikdy ne seznam otázek
- Krátké, jasné odpovědi — maximálně 3-4 věty + jedna otázka
- Pokud člověk odejde od tématu, jemně ho vrátíš zpět`;

const GENERAL_CHAT_PROMPT = `${BASE_IDENTITY}

Toto je osobní koučovací chat. Pracuješ s celým člověkem a jeho životní situací.

Struktura sezení (volně, přizpůsob se):
1. CHECK-IN: Jak se člověk cítí? Co ho přivedlo?
2. TÉMA: Na čem chce dnes pracovat?
3. PRŮZKUM: Hloubkové otázky k tématu
4. INSIGHT: Co si člověk uvědomil?
5. AKCE: Co udělá jinak? Jaký je první krok?

Nespěchej na strukturu. Nech sezení přirozeně plynout.`;

function buildUserContext(profile: UserProfile): string {
  const genderLabel =
    profile.gender === "male" ? "muž" : profile.gender === "female" ? "žena" : "jiné";

  const lowestAreas = [...profile.lifeAreas]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((a) => `${a.label} (${a.score}/10)`)
    .join(", ");

  const highestAreas = [...profile.lifeAreas]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a) => `${a.label} (${a.score}/10)`)
    .join(", ");

  return `
---
PROFIL KLIENTA (z onboardingu):
- Jméno: ${profile.name}
- Věková skupina: ${profile.age} let
- Pohlaví: ${genderLabel}
- Životní oblasti – nejsilnější: ${highestAreas}
- Životní oblasti – nejslabší: ${lowestAreas}
- Nejšťastnější moment v poslední době: "${profile.happiestMoment}"
- Co o něm říkají přátelé: "${profile.whatFriendsSay}"
- Co o něm říkají rodiče: "${profile.whatParentsSay}"

Oslovuj klienta jménem (${profile.name.split(" ")[0]}) přirozeně, ne v každé větě.
Tento kontext použ jako základ pro hlubší porozumění — neopakuj ho zpět doslovně.
---`;
}

function buildToolContext(toolId: ToolId, data: unknown): string {
  if (toolId === "decision-paralysis") {
    const d = data as DecisionToolData;
    return `
---
KONTEXT Z NÁSTROJE – Paralýza rozhodování:
- Rozhodnutí: ${d.decision}
- Možnosti: ${d.options}
- Co blokuje: ${d.blockers}
- Deadline: ${d.deadline || "neuveden"}
---`;
  }
  if (toolId === "creative-block") {
    const d = data as CreativeToolData;
    return `
---
KONTEXT Z NÁSTROJE – Kreativní blok:
- Projekt/práce: ${d.project}
- Jak dlouho blok trvá: ${d.blockDuration}
- Popis bloku: ${d.blockDescription}
- Co dřív pomáhalo: ${d.whatHelped}
---`;
  }
  if (toolId === "motivation") {
    const d = data as MotivationToolData;
    return `
---
KONTEXT Z NÁSTROJE – Ztráta motivace:
- Oblast: ${d.area}
- Od kdy: ${d.since}
- Co dřív motivovalo: ${d.previousMotivation}
- Jak se teď cítí: ${d.currentFeeling}
---`;
  }
  return "";
}

export interface SystemPromptOptions {
  userProfile?: UserProfile;
  toolContexts?: Array<{ toolId: ToolId; data: unknown }>;
}

// Keep SYSTEM_PROMPTS for backward compatibility
export const SYSTEM_PROMPTS = {
  "decision-paralysis": GENERAL_CHAT_PROMPT,
  "creative-block": GENERAL_CHAT_PROMPT,
  "motivation": GENERAL_CHAT_PROMPT,
  "general": GENERAL_CHAT_PROMPT,
};

export function getSystemPrompt(options: SystemPromptOptions = {}): string {
  let prompt = GENERAL_CHAT_PROMPT;
  if (options.userProfile) {
    prompt += buildUserContext(options.userProfile);
  }
  if (options.toolContexts) {
    for (const { toolId, data } of options.toolContexts) {
      prompt += buildToolContext(toolId, data);
    }
  }
  return prompt;
}
