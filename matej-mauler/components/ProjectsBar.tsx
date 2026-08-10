import { projects } from "@/lib/projects";

/**
 * Poslední blok stránky: jeden zalamovací řádek textových odkazů (flex-wrap, ne grid).
 * Aktivní vs. minulé se neoddělují do sekcí — liší se jen vizuální váhou (.is-past).
 * Typografii každého projektu řídí `data-type` (viz .mm-project v globals.css).
 */
export function ProjectsBar({ className }: { className?: string }) {
  return (
    <nav className={`mm-projects${className ? ` ${className}` : ""}`} aria-label="Projects">
      {projects.map((p) => {
        const cls = `mm-project${p.status === "past" ? " is-past" : ""}`;
        return p.url ? (
          <a key={p.name} href={p.url} className={cls} data-type={p.typeStyle} target="_blank" rel="noopener noreferrer">
            {p.name}
          </a>
        ) : (
          <span key={p.name} className={cls} data-type={p.typeStyle}>
            {p.name}
          </span>
        );
      })}
    </nav>
  );
}
