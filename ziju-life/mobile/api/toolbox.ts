import { apiFetch } from "./client";

export interface Tool {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  duration: string;
  tags: string[];
  tool_type: string;
}

export async function getTools(params?: {
  category?: string;
  tag?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ tools: Tool[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.tag) sp.set("tag", params.tag);
  if (params?.q) sp.set("q", params.q);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return apiFetch(`/api/laborator/toolbox${qs ? `?${qs}` : ""}`);
}

export async function getToolBySlug(slug: string): Promise<{ tool: Tool }> {
  return apiFetch(`/api/laborator/toolbox/${slug}`);
}
