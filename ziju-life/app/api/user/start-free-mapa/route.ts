import { getOrCreateUser, createUserSession, getUserPurchases } from "@/lib/user-auth";
import { sql } from "@/lib/database";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Neplatný e-mail" }, { status: 400 });
  }

  const user = await getOrCreateUser(email.toLowerCase().trim());

  // Vytvoř novou cestu jen pokud žádná aktivní neexistuje
  const purchases = await getUserPurchases(user.id);
  const activeMapaPurchase = purchases.find(
    (p) => p.product_slug === "tvoje-mapa" && !p.completed_at
  );

  if (!activeMapaPurchase) {
    const id = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await sql`
      INSERT INTO purchases (id, user_id, product_slug, stripe_payment_id, created_at)
      VALUES (${id}, ${user.id}, 'tvoje-mapa', NULL, NOW())
    `;
  }

  await createUserSession(user.id);

  return Response.json({ ok: true });
}
