import { apiFetch } from "./client";

export async function checkAccess(): Promise<{
  valid: boolean;
  email?: string;
}> {
  return apiFetch("/api/laborator/check");
}

export async function getAICredits(): Promise<{
  remainingCzk: number;
  usedCzk: number;
  totalCzk: number;
  available: number;
}> {
  return apiFetch("/api/laborator/ai-credits");
}

export async function getUserContext(): Promise<{
  context: Record<string, unknown>;
}> {
  return apiFetch("/api/laborator/user-context");
}

export async function saveUserContext(
  type: string,
  data: unknown
): Promise<{ ok: boolean }> {
  return apiFetch("/api/laborator/user-context", {
    method: "POST",
    body: JSON.stringify({ type, data }),
  });
}

export async function getJourney(): Promise<{
  data: Record<string, unknown> | null;
  purchaseId: string;
}> {
  return apiFetch("/api/laborator/journey");
}

export async function getCheckins(): Promise<{
  checkins: Array<{
    score: number | null;
    week_start_date: string;
    value_scores: Record<string, number> | null;
    area_scores: Record<string, number> | null;
  }>;
  thisWeekDone: boolean;
  thisWeek: string;
}> {
  return apiFetch("/api/laborator/checkin");
}

export async function submitCheckin(
  areaScores: Record<string, number>,
  valueScores?: Record<string, number>
): Promise<{ ok: boolean; week: string; avgScore: number }> {
  return apiFetch("/api/laborator/checkin", {
    method: "POST",
    body: JSON.stringify({ areaScores, valueScores }),
  });
}

interface AICoachMessage {
  role: "user" | "assistant";
  content: string;
}

export async function aiCoach(messages: AICoachMessage[]): Promise<{
  type: "recommendations" | "reflection" | "cannot_help";
  response?: unknown;
  text?: string;
  topic?: string;
  budget?: { remainingCzk: number; usedCzk: number; totalCzk: number };
}> {
  return apiFetch("/api/laborator/ai-coach", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
