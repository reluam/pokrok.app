"use client";

import { useRouter } from "next/navigation";
import { useProjects } from "../contexts/ProjectsContext";

export function ClientProjectSelect({
  clientId,
  projectId,
}: {
  clientId: string;
  projectId: string | null | undefined;
}) {
  const router = useRouter();
  const projects = useProjects()?.projects ?? [];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value.trim() || null;
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: value }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <select
      value={projectId ?? ""}
      onChange={handleChange}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
    >
      <option value="">— Bez projektu —</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
