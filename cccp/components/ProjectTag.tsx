"use client";

import { useProjects } from "../contexts/ProjectsContext";

export function ProjectTag({ projectId }: { projectId: string | null | undefined }) {
  const projects = useProjects()?.projects ?? [];
  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  if (!project) return null;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: `${project.color}30`, color: project.color }}
    >
      {project.name}
    </span>
  );
}

export function projectBorderStyle(projectId: string | null | undefined, projects: { id: string; color: string }[]): { borderLeftWidth?: number; borderLeftColor?: string } {
  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  if (!project) return {};
  return { borderLeftWidth: 4, borderLeftColor: project.color };
}
