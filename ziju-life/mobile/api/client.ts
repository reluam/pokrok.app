import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

// In dev, use production API (no local Next.js server needed)
// Change to "http://localhost:3000" if running Next.js locally
const API_BASE = "https://ziju.life";

const TOKEN_KEY = "auth_token";

export class AuthExpiredError extends Error {
  constructor() {
    super("Auth token expired");
    this.name = "AuthExpiredError";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`API ${status}: ${body}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (res.status === 401) {
    await clearToken();
    router.replace("/(auth)/login");
    throw new AuthExpiredError();
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}
