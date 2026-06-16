import type { Lang } from "./dictionaries";

// Web je proteď pouze v angličtině. Další jazyky přidáme časem — cs scaffolding
// (dictionaries, Lang typ, lang-keyed DB) zůstává, jen jazyk natvrdo zamykáme na "en".
export async function getLang(): Promise<Lang> {
  return "en";
}
