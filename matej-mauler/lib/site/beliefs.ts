import type { Bi } from "@/lib/about";

/**
 * Tři nejsilnější přesvědčení do rotátoru nahoře na stránce „Jak to vidím".
 * NÁVRH: vybráno z desatera v lib/site/thoughts.ts, ať to jsou Matějova vlastní
 * slova a ne moje. Klidně přepiš — tohle je to první, co na té stránce lidi uvidí.
 */
export type Belief = {
  id: string;
  claim: Bi;
  support: Bi;
};

export const BELIEFS: Belief[] = [
  {
    id: "zodpovednost",
    claim: { cs: "za svůj život jsi zodpovědný pouze ty sám.", en: "you alone are responsible for your life." },
    support: {
      cs: "Můžeš mít podporu, kouče, partnera, komunitu. Ale rozhodnutí, která děláš každé ráno, za tebe nikdo neudělá. To není tlak, ale svoboda.",
      en: "You can have support, a coach, a partner, a community. But nobody makes the decisions you face every morning. That's not pressure, it's freedom.",
    },
  },
  {
    id: "hotove",
    claim: { cs: "hotové je lepší než dokonalé.", en: "done beats perfect." },
    support: {
      cs: "Perfekcionismus je chytře maskovaný strach. Dokud to nepublikuješ, realita ti nedá žádnou zpětnou vazbu — zůstaneš v bezpečí vlastní hlavy.",
      en: "Perfectionism is fear in a clever disguise. Until you publish, reality gives you no feedback — you stay safe inside your own head.",
    },
  },
  {
    id: "cernobile",
    claim: { cs: "skoro nic není pouze černobílé.", en: "almost nothing is only black and white." },
    support: {
      cs: "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Mezi černou a bílou je spousta odstínů — a právě tam si můžeš skládat život podle sebe.",
      en: "Either work or freedom. Either family or career. Between black and white there are plenty of shades — and that's where you get to build a life of your own.",
    },
  },
];
