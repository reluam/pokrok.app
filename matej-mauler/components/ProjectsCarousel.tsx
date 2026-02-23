"use client";

import { useState } from "react";
import BeforeAfterGallery from "./BeforeAfterGallery";
import ImageWithLightbox from "./ImageWithLightbox";

const PROJECTS = [
  {
    id: "skolnijidelny",
    tag: "Web",
    title: "Školníjídelny.cz",
    description: "Kompletně nový web s administrací a napojením na rezervační systém.",
    url: "https://skolnijidelny.vercel.app",
    type: "before-after" as const,
    before: {
      src: "/projekty/skolnijidelny-pred.png",
      alt: "Školníjídelny.cz před rekonstrukcí",
      label: "Před",
    },
    after: {
      src: "/projekty/skolnijidelny-po.png",
      alt: "Školníjídelny.cz po rekonstrukci",
      label: "Po",
    },
  },
  {
    id: "pokrok",
    tag: "Aplikace",
    title: "Pokrok.app",
    description: "Komplexní webová aplikace pro plánování. Multijazyčná, s uživatelskými účty a napojením na databáze.",
    url: "https://pokrok.app",
    type: "image" as const,
    src: "/projekty/pokrok.png",
    alt: "Náhled aplikace Pokrok.app",
  },
  {
    id: "ziju-life",
    tag: "Blog",
    title: "Žiju life",
    description: "Můj osobní blog, jehož součástí je i administrace.",
    url: "https://ziju.life",
    type: "image" as const,
    src: "/projekty/ziju-life.png",
    alt: "Náhled blogu Žiju life",
  },
];

export default function ProjectsCarousel() {
  const [index, setIndex] = useState(0);
  const project = PROJECTS[index];
  const goPrev = () => setIndex((i) => (i === 0 ? PROJECTS.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === PROJECTS.length - 1 ? 0 : i + 1));

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        {/* Náhled projektu */}
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          {project.type === "before-after" && project.before && project.after ? (
            <BeforeAfterGallery before={project.before} after={project.after} />
          ) : project.type === "image" && project.src ? (
            <ImageWithLightbox
              src={project.src}
              alt={project.alt}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : null}
        </div>
      </div>
      <div className="border-t border-black/10 p-4 md:p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-black/10 px-2.5 py-1 text-xs font-600 text-[var(--fg)]">
            {project.tag}
          </span>
          <span className="text-xs text-[var(--fg-muted)]">
            {index + 1} / {PROJECTS.length}
          </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--fg)] shadow-sm transition hover:bg-white"
              aria-label="Předchozí projekt"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--fg)] shadow-sm transition hover:bg-white"
              aria-label="Další projekt"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
        <h3 className="mb-1 text-xl font-700 text-[var(--fg)]">{project.title}</h3>
        <p className="mb-3 text-sm text-[var(--fg-muted)]">{project.description}</p>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-600 text-[var(--accent)] hover:underline"
        >
          Navštívit web →
        </a>
      </div>
    </div>
  );
}
