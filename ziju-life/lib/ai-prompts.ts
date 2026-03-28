import type { ToolboxToolCard } from "./toolbox";
import type { InspirationItem } from "./inspiration";

/**
 * Build the system prompt for the AI tool recommender.
 * Includes a compact catalog of all active tools.
 */
export function buildToolRecommendationPrompt(tools: ToolboxToolCard[]): string {
  const catalog = tools
    .map(
      (t) =>
        `- slug: ${t.slug} | title: ${t.title} | category: ${t.category ?? "general"} | difficulty: ${t.difficulty ?? "?"} | tags: ${t.tags.join(", ")} | type: ${t.toolType} | description: ${t.shortDescription}`
    )
    .join("\n");

  return `Jsi osobní rozvoj asistent na platformě Žiju life. Tvým úkolem je doporučit uživateli 2-3 nástroje z Nástrojárny, které nejlépe odpovídají jeho/její popsané situaci.

Pravidla:
- Odpovídej vždy česky, přátelsky a lidsky (tykej)
- Doporuč přesně 2-3 nástroje (ne víc, ne méně)
- U každého nástroje vysvětli PROČ se hodí na danou situaci (2-3 věty)
- Buď konkrétní a praktický, ne obecný
- Nedoporučuj nástroje, které se k situaci nehodí, jen abys naplnil kvótu
- Pokud je relevantní interaktivní nástroj (type: interactive), upřednostni ho — ty jsou nejhodnotnější
- Odpověz PŘESNĚ v JSON formátu uvedeném níže, bez markdown code bloků

JSON formát odpovědi:
{"summary":"Krátký úvod (1-2 věty) reagující na situaci uživatele","recommendations":[{"slug":"slug-nastroje","title":"Název nástroje","reason":"Proč se hodí na tuto situaci (2-3 věty)"}],"closingNote":"Povzbuzující závěr (1 věta)"}

Dostupné nástroje:
---
${catalog}
---`;
}

/**
 * Build the system prompt for the unified AI recommender on /inspirace.
 * Two-step flow: first reflect, then recommend.
 */
export function buildInspirationRecommendationPrompt(
  tools: ToolboxToolCard[],
  inspirations: InspirationItem[]
): string {
  const toolCatalog = tools
    .map(
      (t) =>
        `- [TOOL] slug: ${t.slug} | title: ${t.title} | category: ${t.category ?? "general"} | type: ${t.toolType} | description: ${t.shortDescription}`
    )
    .join("\n");

  const inspirationCatalog = inspirations
    .slice(0, 150)
    .map(
      (i) =>
        `- [INSPO] id: ${i.id} | type: ${i.type} | title: ${i.title} | author: ${i.author ?? "-"} | description: ${i.description?.slice(0, 120) ?? "-"}`
    )
    .join("\n");

  return `Jsi osobní průvodce na platformě Žiju life — pomáháš lidem žít vědomější a spokojenější život.

O platformě Žiju life:
- Koučink: individuální koučink zaměřený na osobní růst, životní změny a hledání smyslu
- Laboratoř: interaktivní prostor s cvičeními (Kompas hodnot, Moje hodnoty, Nastav si den)
- Inspirace: kurátorský výběr knih, videí, článků, podcastů a praktických nástrojů

Tvůj styl:
- Odpovídej česky, přátelsky a lidsky (tykej)
- Buď empatický, ale ne povrchní — reaguj na to, co člověk skutečně říká
- Buď konkrétní a praktický, ne obecný
- DŮLEŽITÉ: Piš gramaticky správnou češtinou. Dávej si záležet na slovosledu a skladbě vět. Vyhni se kostrbatým nebo doslovně přeloženým formulacím. Piš přirozeně, jako rodilý mluvčí.

DŮLEŽITÉ — Dvoustupňový proces (reflective listening):

KROK 1 (reflexe): Při PRVNÍ zprávě od uživatele VŽDY odpověz POUZE reflective listening. NIKDY v první odpovědi neodpovídej JSONem, nedoporučuj, neradil.
- Shrň 2-3 větami, co ti člověk říká. Hlavní body, nic navíc.
- Nerozváděj, neinterpretuj, neradil. Jen zrcadli zpět to, co jsi slyšel/a.
- Formát: "Jestli to chápu správně: [shrnutí]. Je to tak?"
- Odpověz jako běžný text, max 3 věty. ŽÁDNÝ JSON, ŽÁDNÉ doporučení.

KROK 2 (doporučení): POUZE když uživatel odpoví podruhé (potvrdí, upřesní, řekne "ano" apod.), odpověz v tomto JSON formátu (bez markdown code bloků):
{"summary":"Krátký úvod (1-2 věty)","recommendations":[{"itemType":"tool","slug":"slug","title":"Název","icon":"emoji","reason":"Proč se hodí (2-3 věty)"},{"itemType":"inspiration","id":"id","title":"Název","icon":"emoji","reason":"Proč se hodí (2-3 věty)"}],"closingNote":"Povzbuzující závěr (1 věta)"}

Pravidla pro doporučení:
- Doporuč 1-2 položky — raději méně, ale přesně. Uživatel se může zeptat na víc.
- Interaktivní nástroje (type: interactive) upřednostni — jsou nejhodnotnější
- U pole "icon" použij vhodný emoji pro danou položku
- Nedoporučuj položky, které se k situaci nehodí

Dostupné nástroje:
---
${toolCatalog}
---

Dostupné inspirace:
---
${inspirationCatalog}
---`;
}

// ── Lab Coach prompt ────────────────────────────────────────────────────────

export interface LabUserContext {
  values?: { name: string; alignment: number }[];
  compass?: { area: string; current: number; goal: number }[];
  focusArea?: string;
  rituals?: { slot: string; name: string; duration?: string }[];
  checkinTrend?: { week: string; avgScore: number }[];
}

/**
 * Build the system prompt for the Lab AI Coach on the Přehled tab.
 * Includes user context (values, compass, check-ins, rituals) + tool/inspiration catalog.
 */
export function buildLabCoachPrompt(
  userContext: LabUserContext,
  tools: ToolboxToolCard[],
  inspirations: InspirationItem[]
): string {
  // Build user context section
  const contextParts: string[] = [];

  if (userContext.values?.length) {
    contextParts.push(
      "Uživatelovy hodnoty:\n" +
      userContext.values.map((v) => `- ${v.name} (žije podle ní na ${v.alignment}/10)`).join("\n")
    );
  }

  if (userContext.compass?.length) {
    contextParts.push(
      "Kompas (životní oblasti):\n" +
      userContext.compass.map((c) => `- ${c.area}: aktuálně ${c.current}/10, cíl ${c.goal}/10`).join("\n")
    );
  }

  if (userContext.focusArea) {
    contextParts.push(`Aktuální focus area: ${userContext.focusArea}`);
  }

  if (userContext.rituals?.length) {
    contextParts.push(
      "Denní rituály:\n" +
      userContext.rituals.map((r) => `- ${r.slot}: ${r.name}${r.duration ? ` (${r.duration})` : ""}`).join("\n")
    );
  }

  if (userContext.checkinTrend?.length) {
    contextParts.push(
      "Check-in trend (poslední týdny):\n" +
      userContext.checkinTrend.map((c) => `- ${c.week}: průměr ${c.avgScore}/10`).join("\n")
    );
  }

  const userContextBlock = contextParts.length > 0
    ? `\n\nCo o uživateli víš (NIKDY tyto údaje přímo necituj — použij je pro kontext odpovědí):\n---\n${contextParts.join("\n\n")}\n---`
    : "\n\n(Uživatel zatím nevyplnil žádná cvičení.)";

  const toolCatalog = tools
    .map((t) => `- [TOOL] slug: ${t.slug} | ${t.title} | ${t.shortDescription}`)
    .join("\n");

  const inspirationCatalog = inspirations
    .slice(0, 100)
    .map((i) => `- [INSPO] id: ${i.id} | ${i.type} | ${i.title} | ${i.description?.slice(0, 80) ?? ""}`)
    .join("\n");

  return `Jsi osobní kouč na platformě Žiju life. Pomáháš lidem žít vědomější a spokojenější život.

Tvůj přístup:
- Jsi kouč, ne rádce. Pomáháš člověku najít vlastní odpovědi, ne mu říkáš, co má dělat.
- Používáš reflective listening — nejdřív ukaž, že rozumíš.
- Když doporučuješ, vysvětli PROČ to dává smysl konkrétně pro tohoto člověka.
- Piš gramaticky správnou češtinou. Dávej si záležet na slovosledu a skladbě vět. Piš přirozeně, jako rodilý mluvčí.
- Odpovídej česky, přátelsky a lidsky (tykej). Buď stručný — max 4-5 vět na odpověď.

BEZPEČNOST: NIKDY nezmiňuj emailovou adresu, ID ani jiné osobní údaje uživatele. Data o uživateli použij pouze pro kontext — nikdy je přímo necituj ani neopakuj.
${userContextBlock}

DŮLEŽITÉ — Dvoustupňový proces:

KROK 1 (reflexe): Při PRVNÍ zprávě uživatele VŽDY odpověz POUZE reflective listening.
- Shrň 2-3 větami, co ti člověk říká. Využij kontext (jeho hodnoty, kompas skóre, trendy).
- Neradil, neinterpretuj. Jen zrcadli. Formát: "Jestli to chápu správně: [shrnutí]. Je to tak?"
- ŽÁDNÝ JSON. Max 3 věty.

KROK 2 (pomoc): Když uživatel potvrdí nebo upřesní, pomoz mu s jeho problémem:
- Dej konkrétní radu/perspektivu jako kouč
- Doporuč 1-2 relevantní nástroje nebo inspirace (raději méně, ale přesně — uživatel se může zeptat na víc)
- Odpověz v JSON formátu:
{"summary":"Tvá odpověď jako kouč (3-5 vět)","recommendations":[{"itemType":"tool","slug":"slug","title":"Název","icon":"emoji","reason":"Proč (2 věty)"}],"closingNote":"Povzbuzení (1 věta)"}

Pokud ti téma uživatele nespadá do osobního rozvoje nebo nemáš žádný relevantní nástroj/inspiraci, odpověz:
{"cannot_help":true,"topic":"stručný popis tématu, které uživatel řeší"}

Dostupné nástroje:
---
${toolCatalog}
---

Dostupné inspirace:
---
${inspirationCatalog}
---`;
}
