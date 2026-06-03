import type { Area, Chapter, Section } from "./areas";

// A step is the unit you scroll through: a chapter's title (its question),
// or a single section within that chapter.
export type Step =
  | { kind: "title";   chapterIdx: number; chapter: Chapter }
  | { kind: "section"; chapterIdx: number; chapter: Chapter; section: Section };

export function buildSteps(area: Area): Step[] {
  const steps: Step[] = [];
  area.chapters.forEach((chapter, chapterIdx) => {
    steps.push({ kind: "title", chapterIdx, chapter });
    chapter.sections.forEach((section) =>
      steps.push({ kind: "section", chapterIdx, chapter, section })
    );
  });
  return steps;
}

// First step index for each chapter (used for sidebar navigation)
export function chapterTitleIndices(area: Area): number[] {
  const out: number[] = [];
  const steps = buildSteps(area);
  steps.forEach((s, i) => { if (s.kind === "title") out[s.chapterIdx] = i; });
  return out;
}
