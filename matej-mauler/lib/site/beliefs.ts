import type { Bi } from "@/lib/about";

/**
 * Tři nejsilnější přesvědčení do rotátoru nahoře na stránce „Jak to vidím".
 * NÁVRH: vybráno z desatera v lib/site/thoughts.ts. Všechno je psané v první
 * osobě — nejsou to rady čtenáři, ale to, co si Matěj myslí o sobě.
 */
export type Belief = {
  id: string;
  claim: Bi;
  support: Bi;
};

export const BELIEFS: Belief[] = [
  {
    id: "zodpovednost",
    claim: { cs: "za svůj život jsem zodpovědný pouze já sám.", en: "I alone am responsible for my life." },
    support: {
      cs: "Můžu mít podporu, kouče, partnerku, komunitu. Ale rozhodnutí, která mě čekají každé ráno, za mě nikdo neudělá. Není to tlak, je to svoboda.",
      en: "I can have support, a coach, a partner, a community. But nobody makes the decisions waiting for me every morning. That's not pressure, it's freedom.",
    },
  },
  {
    id: "hotove",
    claim: { cs: "hotové je lepší než dokonalé.", en: "done beats perfect." },
    support: {
      cs: "Perfekcionismus je můj chytře maskovaný strach. Dokud to nevypustím ven, realita mi nedá žádnou zpětnou vazbu — zůstanu v bezpečí vlastní hlavy.",
      en: "Perfectionism is my fear in a clever disguise. Until I put it out there, reality gives me no feedback — I just stay safe inside my own head.",
    },
  },
  {
    id: "cernobile",
    claim: { cs: "skoro nic není pouze černobílé.", en: "almost nothing is only black and white." },
    support: {
      cs: "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Mezi černou a bílou je spousta odstínů — a právě tam si skládám život podle sebe.",
      en: "Either work or freedom. Either family or career. Between black and white there are plenty of shades — and that's where I get to build a life of my own.",
    },
  },
];
