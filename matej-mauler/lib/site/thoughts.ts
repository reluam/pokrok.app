import type { Conviction } from "./beliefs";

/**
 * ● Jak se kvůli tomu chovám. Pod trojúhelníkem přesvědčení v sekci „Jak to vidím".
 * Vybráno z původního desatera — zbytek vypadl, protože se buď kryl s něčím jiným,
 * nebo to byl obsah, který najdeš na kterémkoli seberozvojovém webu.
 */
export const RULES: Conviction[] = [
  {
    id: "hotove",
    claim: { cs: "Hotové je lepší než dokonalé.", en: "Done beats perfect." },
    support: {
      cs: "Umím něco ladit měsíce. Dokud to není venku, nic mi neřekne, jestli jsem měl pravdu. Pořád mi to nejde.",
      en: "I can polish something for months. Until it's out, nothing tells me whether I was right. I'm still bad at this.",
    },
  },
  {
    id: "jedna-vec",
    claim: { cs: "Žádná jedna věc to nespraví.", en: "Nothing gets fixed in one move." },
    support: {
      cs: "Žádná kniha, žádný kurz, žádné jedno rozhodnutí to za mě neudělaly. Jenom hodně malých věcí naskládaných v čase.",
      en: "No book, no course, no single decision has ever done it for me. Only a lot of small things stacked over time.",
    },
  },
  {
    id: "sebevedomi",
    claim: {
      cs: "Sebevědomí přijde až potom, ne předtím.",
      en: "Confidence comes after, not before.",
    },
    support: {
      cs: "Nikdy jsem se do toho nepřemluvil. Vždycky jsem to jenom udělal a zjistil to až pak.",
      en: "I've never talked myself into it. I've only ever done the thing and found out afterwards.",
    },
  },
  {
    id: "intuice",
    claim: {
      cs: "Divný pocit beru vážně, pak si ho ověřím.",
      en: "I take the weird feeling seriously, then check it.",
    },
    support: {
      cs: "Není to magie, je to můj mozek, co si něčeho všiml dřív, než to umím pojmenovat. Dobrý první signál, špatná konečná odpověď.",
      en: "It's not magic, it's my brain noticing something before I can name it. Good first signal, bad final answer.",
    },
  },
  {
    id: "vazne-sebe",
    claim: { cs: "Neberu se tak vážně.", en: "I don't take myself that seriously." },
    support: {
      cs: "Když je všechno vážné, každá chyba je katastrofa. Je to jediná věc, co mě spolehlivě donutí zkusit něco veřejně.",
      en: "When everything is serious, every mistake is a disaster. It's the only thing that reliably gets me to try something in public.",
    },
  },
];
