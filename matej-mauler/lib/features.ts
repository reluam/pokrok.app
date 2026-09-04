/**
 * Dočasné vypínače celých kusů webu.
 *
 * ACCOUNTS_ENABLED: Spaghetti účty (Clerk přihlášení, profil na /me, XP, badge,
 * komentáře a hodnocení) jsou prozatím schované. Nic se nemaže — kód, DB tabulky
 * i sekce „Spaghetti accounts, XP & badges" v CLAUDE.md zůstávají, jen se k nim
 * nedá dostat. Návrat = přepnout tohle na true (a mít ve Vercelu Clerk klíče).
 *
 * Dokud je false, experience si ukládají stav jen do prohlížeče.
 */
export const ACCOUNTS_ENABLED = false;
