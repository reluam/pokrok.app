export type Lang = "en" | "cs";

export const ui: Record<Lang, {
  subtitle: string;
  tagline: string;
  title: string;
  start: string;
  startHint: string;
  back: string;
  end: string;
}> = {
  en: {
    subtitle: "Life's path",
    tagline: "Questions of one person about life, meaning, and everything else.",
    title: "Journey",
    start: "Begin the journey",
    startHint: "↓  (space)",
    back: "← menu",
    end: "The end? Or a new beginning.",
  },
  cs: {
    subtitle: "Životní cesta",
    tagline: "Otázky jednoho člověka o životě, smyslu a všem ostatním.",
    title: "Cesta",
    start: "Začít cestu",
    startHint: "↓  (mezerník)",
    back: "← menu",
    end: "Konec? Nebo nový začátek.",
  },
};
