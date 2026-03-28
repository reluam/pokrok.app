import { apiFetch } from "./client";

export async function sendMagicLink(email: string): Promise<{ ok: boolean }> {
  return apiFetch("/api/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email, source: "mobile" }),
  });
}

export async function verifyMobileToken(
  token: string
): Promise<{ accessToken: string; user: { id: string; email: string } }> {
  return apiFetch("/api/auth/verify-mobile", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function verifyCode(
  email: string,
  code: string
): Promise<{ ok: boolean; accessToken: string; user: { id: string; email: string } }> {
  return apiFetch("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code, source: "mobile" }),
  });
}

export async function checkSession(): Promise<{
  loggedIn: boolean;
  email?: string;
}> {
  return apiFetch("/api/auth/me");
}
