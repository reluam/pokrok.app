/**
 * Drafty a jejich cesty — bez závislosti na databázi i na DB modulech.
 *
 * Samostatný soubor schválně: importuje to jak experimentsDb, tak proxy.ts,
 * a middleware nesmí táhnout neon klienta ani next/navigation.
 */

/** Slugy, které se seedují jako draft. Musí sedět se seedem v experimentsDb. */
export const DRAFT_SLUGS: ReadonlySet<string> = new Set(["about", "decision-maker", "life-manual"]);

/** Cesty těch draftů. Dnes se shodují se slugy, ale ať to není náhoda. */
export const DRAFT_PATHS: ReadonlySet<string> = new Set(["/about", "/decision-maker", "/life-manual"]);

/**
 * Na preview a lokálně jsou drafty vidět, na ostré ne.
 * Pozn.: chybějící VERCEL_ENV znamená „ukaž drafty" — to je fail-open a je to
 * vědomé, protože jinde (proxy, guardExperiment) je to jediný způsob, jak si
 * drafty prohlédnout před vydáním.
 */
export const showDrafts = () => process.env.VERCEL_ENV !== "production";
