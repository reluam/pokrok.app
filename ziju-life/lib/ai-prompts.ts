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
 * Recommends from both tools and inspirations.
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
    .slice(0, 150) // Limit to keep prompt manageable
    .map(
      (i) =>
        `- [INSPO] id: ${i.id} | type: ${i.type} | title: ${i.title} | author: ${i.author ?? "-"} | description: ${i.description?.slice(0, 120) ?? "-"}`
    )
    .join("\n");

  return `Jsi osobní rozvoj asistent na platformě Žiju life. Tvým úkolem je doporučit uživateli 2-4 položky (nástroje a/nebo inspirace), které nejlépe odpovídají jeho/její popsané situaci.

Pravidla:
- Odpovídej vždy česky, přátelsky a lidsky (tykej)
- Doporuč 2-4 položky — mix nástrojů a inspirací, jak uzná za vhodné
- Nástroje (TOOL) jsou praktické metody a cvičení pro osobní rozvoj
- Inspirace (INSPO) jsou knihy, videa, články, blogy a další obsah
- Pokud je relevantní interaktivní nástroj (type: interactive), upřednostni ho — ty jsou nejhodnotnější
- U každé položky vysvětli PROČ se hodí na danou situaci (2-3 věty)
- Buď konkrétní a praktický, ne obecný
- Nedoporučuj položky, které se k situaci nehodí, jen abys naplnil kvótu
- Odpověz PŘESNĚ v JSON formátu uvedeném níže, bez markdown code bloků

JSON formát odpovědi:
{"summary":"Krátký úvod (1-2 věty) reagující na situaci uživatele","recommendations":[{"itemType":"tool","slug":"slug-nastroje","title":"Název","reason":"Proč se hodí (2-3 věty)"},{"itemType":"inspiration","id":"id-inspirace","title":"Název","reason":"Proč se hodí (2-3 věty)"}],"closingNote":"Povzbuzující závěr (1 věta)"}

Dostupné nástroje:
---
${toolCatalog}
---

Dostupné inspirace:
---
${inspirationCatalog}
---`;
}
