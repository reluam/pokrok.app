import { cookies } from "next/headers";

export async function isAdmin(): Promise<boolean> {
  try {
    const c = await cookies();
    const secret = process.env.ADMIN_SECRET;
    return !!secret && c.get("admin_token")?.value === secret;
  } catch {
    return false;
  }
}

export function isAdminReq(req: { cookies: { get: (n: string) => { value: string } | undefined } }): boolean {
  return !!process.env.ADMIN_SECRET && req.cookies.get("admin_token")?.value === process.env.ADMIN_SECRET;
}
