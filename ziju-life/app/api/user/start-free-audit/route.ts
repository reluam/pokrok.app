import { getOrCreateUser, createFreePurchase, createUserSession, getJourneyData } from "@/lib/user-auth";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Neplatný e-mail" }, { status: 400 });
  }

  const user = await getOrCreateUser(email.toLowerCase().trim());

  // Vytvoř novou cestu jen pokud žádná aktivní neexistuje
  const existing = await getJourneyData(user.id);
  if (!existing) {
    await createFreePurchase(user.id);
  }

  await createUserSession(user.id);

  return Response.json({ ok: true });
}
