export type VvvUi = {
  back: string; backToList: string; fullName: string; subtitle: string;
  search: string; addTerm: string; newTerm: string; termName: string;
  termDesc: string; authorPlaceholder: string; add: string; cancel: string;
  adding: string; countOne: string; countMany: string;
  ofTotal: (n: number) => string; forQuery: (q: string) => string;
  community: string; voteTitle: string;
  warnHeading: string; warnSub: string; warnBody1: string; warnBody2: string;
  enter: string; recordOne: string; recordFew: string; recordMany: string;
  clarify: string; clarifyPlaceholder: string; send: string; sending: string;
  originalLabel: string; captchaError: string; voteLimit: string;
  defaultAuthor: string;
};

export const vvvUi: Record<"cs" | "en", VvvUi> = {
  cs: {
    back: "← Spaghetti.ltd",
    backToList: "← VVV",
    fullName: "Vast Void Vault",
    subtitle: "Encyklopedie kompletnější, než-li doposud uznáván Stopařův průvodce po galaxii.",
    search: "Hledat termín...",
    addTerm: "+ Přidat termín",
    newTerm: "Nový termín",
    termName: "Název termínu",
    termDesc: "Definice / popis...",
    authorPlaceholder: "Jméno (nepovinné — výchozí: Neznámý dobrodinec)",
    add: "Přidat →",
    cancel: "Zrušit",
    adding: "Přidávám...",
    countOne: "termín",
    countMany: "termínů",
    ofTotal: (n: number) => `z ${n} celkem`,
    forQuery: (q: string) => `pro „${q}"`,
    community: "⚠️ komunita",
    voteTitle: "Hlasovat (1× za 24 hodin)",
    // entry warning
    warnHeading: "UPOZORNĚNÍ",
    warnSub: "Veškeré vesmírné vědění",
    warnBody1: "Tato encyklopedie obsahuje veškeré vesmírné vědění — včetně znalostí přidaných kýmkoliv s přístupem k internetu a minimální zodpovědností.",
    warnBody2: "Vstupem souhlasíte s tím, že nebudete pohoršeni tím, co uvidíte.",
    enter: "Vstoupit do encyklopedie →",
    // term detail
    recordOne: "záznam",
    recordFew: "záznamy",
    recordMany: "záznamů",
    clarify: "Upřesnit →",
    clarifyPlaceholder: "Upřesnění nebo doplnění termínu...",
    send: "Odeslat →",
    sending: "Odesílám...",
    originalLabel: "Původní popis",
    captchaError: "Špatná odpověď na captchu.",
    voteLimit: "Již jsi hlasoval/a. Limit je 1× za 24 hodin.",
    defaultAuthor: "Neznámý dobrodinec",
  },
  en: {
    back: "← Spaghetti.ltd",
    backToList: "← VVV",
    fullName: "Vast Void Vault",
    subtitle: "An encyclopedia more complete than the hitherto recognized Hitchhiker's Guide to the Galaxy.",
    search: "Search a term...",
    addTerm: "+ Add term",
    newTerm: "New term",
    termName: "Term name",
    termDesc: "Definition / description...",
    authorPlaceholder: "Name (optional — default: Unknown Benefactor)",
    add: "Add →",
    cancel: "Cancel",
    adding: "Adding...",
    countOne: "term",
    countMany: "terms",
    ofTotal: (n: number) => `of ${n} total`,
    forQuery: (q: string) => `for „${q}"`,
    community: "⚠️ community",
    voteTitle: "Vote (once per 24 hours)",
    warnHeading: "WARNING",
    warnSub: "Vast Void Vault",
    warnBody1: "This encyclopedia contains all the knowledge of the universe — including knowledge added by anyone with internet access and minimal accountability.",
    warnBody2: "By entering, you agree not to be offended by what you see.",
    enter: "Enter the encyclopedia →",
    recordOne: "record",
    recordFew: "records",
    recordMany: "records",
    clarify: "Clarify →",
    clarifyPlaceholder: "Clarification or addition to the term...",
    send: "Send →",
    sending: "Sending...",
    originalLabel: "Original description",
    captchaError: "Wrong captcha answer.",
    voteLimit: "You already voted. Limit is once per 24 hours.",
    defaultAuthor: "Unknown Benefactor",
  },
};
