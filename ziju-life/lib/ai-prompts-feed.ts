import type { Principle } from "./principles";

interface FeedPostForPrompt {
  id: string;
  slug: string;
  type: string;
  title: string;
  subtitle?: string | null;
  body_markdown: string;
  categories?: string[];
  tags?: string[];
}

/**
 * Build the system prompt for the Feed AI Q&A.
 * Includes all published curated posts and active principles as numbered sources.
 */
export function buildFeedAskPrompt(
  posts: FeedPostForPrompt[],
  principles: Principle[]
): string {
  let sourceIndex = 1;
  const sourceLines: string[] = [];

  // Posts
  for (const post of posts) {
    const cats = post.categories?.join(", ") || "";
    const tags = post.tags?.join(", ") || "";
    const meta = [cats && `kategorie: ${cats}`, tags && `tagy: ${tags}`].filter(Boolean).join(", ");
    // Limit body to ~2000 chars to manage token usage
    const body = post.body_markdown.substring(0, 2000);
    sourceLines.push(
      `[${sourceIndex}] "${post.title}" (typ: ${post.type}, slug: ${post.slug}${meta ? `, ${meta}` : ""})\n${body}`
    );
    sourceIndex++;
  }

  // Principles
  for (const p of principles) {
    const body = p.contentMarkdown.substring(0, 1500);
    sourceLines.push(
      `[${sourceIndex}] PRINCIP: "${p.title}" (slug: ${p.slug})\n${p.shortDescription}\n${body}`
    );
    sourceIndex++;
  }

  const catalog = sourceLines.join("\n\n---\n\n");

  return `Jsi znalostní průvodce platformy Žiju life. Odpovídáš na otázky o osobním rozvoji, zdraví, psychologii, mindfulness a produktivitě na základě obsahu publikovaného na žiju.life.

## Pravidla
- Odpovídej česky, tykej, buď přátelský a lidský
- Strukturuj odpověď přehledně — používej nadpisy, číslované seznamy, odrážky
- Když najdeš relevantní obsah v knihovně žiju.life, odpověz na jeho základě a cituj zdroje pomocí [číslo] (např. [1], [3])
- Když relevantní obsah NENAJDEŠ, upřímně řekni: "Na žiju.life k tomuto tématu zatím nemáme obsah." a nabídni obecnou radu na základě svých znalostí
- Vždy navrhni 2-3 navazující otázky, které by mohly uživatele zajímat
- NIKDY si nevymýšlej obsah, který ve zdrojích není — cituj jen to, co skutečně existuje
- Buď konkrétní a praktický, ne obecný

## Formát odpovědi
Odpověz PŘESNĚ v tomto JSON formátu (bez markdown code bloků):
{
  "answer": "Markdown text odpovědi s citacemi [1], [2]...",
  "sources": [{"id": 1, "title": "Název článku", "slug": "slug-clanku", "type": "post"}, ...],
  "followUps": ["Navazující otázka 1?", "Navazující otázka 2?", "Navazující otázka 3?"],
  "hasZijuContent": true
}

Pole "sources" obsahuje POUZE zdroje, které jsi skutečně citoval v odpovědi.
Pole "type" je "post" pro články z feedu nebo "principle" pro principy.
Pole "hasZijuContent" je true, pokud jsi našel relevantní obsah na žiju.life, false pokud ne.

## Dostupný obsah žiju.life
---
${catalog}
---`;
}
