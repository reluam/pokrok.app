import { apiFetch } from "./client";

export interface InspirationItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  url?: string;
  author?: string;
  content?: string;
  thumbnail?: string;
  imageUrl?: string;
  isActive: boolean;
  categoryId?: string;
}

export async function getFeed(params?: {
  offset?: number;
  limit?: number;
  type?: string;
}): Promise<{ items: InspirationItem[]; total: number }> {
  const sp = new URLSearchParams();
  sp.set("feed", "true");
  if (params?.offset) sp.set("offset", String(params.offset));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.type) sp.set("type", params.type);
  return apiFetch(`/api/inspiration?${sp.toString()}`);
}

export async function aiRecommend(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{
  type: "recommendations" | "reflection";
  response?: unknown;
  text?: string;
  budget?: unknown;
  freeUsage?: { used: number; limit: number; remaining: number };
}> {
  return apiFetch("/api/inspirace/ai-recommend", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
