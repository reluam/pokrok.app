"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectsContextValue = {
  projects: Project[];
  selectedProjectIds: string[];
  setSelectedProjectIds: (ids: string[]) => void;
  toggleProject: (id: string) => void;
  showSolo: (id: string) => void;
  refetchProjects: () => Promise<void>;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function useProjects() {
  return useContext(ProjectsContext);
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);

  const refetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    refetchProjects();
  }, [refetchProjects]);

  const projectsParam = searchParams.get("projects");
  const selectedProjectIds =
    projectsParam
      ? projectsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : projects.map((p) => p.id);

  const setSelectedProjectIds = useCallback(
    (ids: string[]) => {
      const q = new URLSearchParams(searchParams.toString());
      if (ids.length === 0 || ids.length === projects.length) {
        q.delete("projects");
      } else {
        q.set("projects", ids.join(","));
      }
      const query = q.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, projects.length]
  );

  const toggleProject = useCallback(
    (id: string) => {
      const current = projectsParam
        ? projectsParam.split(",").map((s) => s.trim()).filter(Boolean)
        : projects.map((p) => p.id);
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      setSelectedProjectIds(next);
    },
    [projectsParam, projects, setSelectedProjectIds]
  );

  const showSolo = useCallback(
    (id: string) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("projects", id);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const value: ProjectsContextValue = {
    projects,
    selectedProjectIds,
    setSelectedProjectIds,
    toggleProject,
    showSolo,
    refetchProjects,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
