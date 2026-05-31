export type SectionType = "text" | "quote";

export type Section = {
  id: string;
  type: SectionType;
  en: string;
  cs: string;
};

export type ChapterMeta = {
  subtitle: string;
  title: string;
};

export type Chapter = {
  id: number;
  slug: string;
  order: number;
  en: ChapterMeta;
  cs: ChapterMeta;
  sections: Section[];
};

export type AreaMeta = {
  name: string;
};

export type AreaIntro = {
  eyebrow: string;
  title: string;
  tagline: string;
};

export type Area = {
  id: string;
  slug: string;
  order: number;
  en: AreaMeta;
  cs: AreaMeta;
  intro?: { en: AreaIntro; cs: AreaIntro };
  chapters: Chapter[];
};
