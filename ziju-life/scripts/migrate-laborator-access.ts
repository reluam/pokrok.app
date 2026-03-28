/**
 * Migration + seed script for laborator_access table.
 *
 * This table caches subscription status so that checkLaboratorAccess()
 * can do a single fast DB query instead of calling Stripe API on every request.
 *
 * Usage:
 *   npx tsx scripts/migrate-laborator-access.ts
 *
 * Prerequisites:
 *   - DATABASE_URL env var set
 *   - STRIPE_SECRET_KEY env var set
 */

import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY is not set");
  process.exit(1);
}

const sql = neon(connectionString);
const stripe = new Stripe(stripeSecretKey);

async function migrate() {
  console.log("Creating laborator_access table...");
  await sql`
    CREATE TABLE IF NOT EXISTS laborator_access (
      email TEXT PRIMARY KEY,
      has_access BOOLEAN NOT NULL DEFAULT false,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT,
      source TEXT NOT NULL DEFAULT 'stripe',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("Table created.");
}

async function seedFromStripe() {
  console.log("Seeding from Stripe subscriptions...");
  let count = 0;

  // Iterate through all active subscriptions
  for await (const sub of stripe.subscriptions.list({
    status: "active",
    expand: ["data.customer"],
    limit: 100,
  })) {
    const customer = sub.customer as Stripe.Customer;
    if (!customer.email) continue;

    const email = customer.email.toLowerCase();
    await sql`
      INSERT INTO laborator_access (email, has_access, stripe_customer_id, stripe_subscription_id, subscription_status, source, updated_at)
      VALUES (${email}, true, ${customer.id}, ${sub.id}, 'active', 'stripe', NOW())
      ON CONFLICT (email) DO UPDATE SET
        has_access = true,
        stripe_customer_id = ${customer.id},
        stripe_subscription_id = ${sub.id},
        subscription_status = 'active',
        source = 'stripe',
        updated_at = NOW()
    `;
    count++;
  }

  // Also iterate through trialing subscriptions
  for await (const sub of stripe.subscriptions.list({
    status: "trialing",
    expand: ["data.customer"],
    limit: 100,
  })) {
    const customer = sub.customer as Stripe.Customer;
    if (!customer.email) continue;

    const email = customer.email.toLowerCase();
    await sql`
      INSERT INTO laborator_access (email, has_access, stripe_customer_id, stripe_subscription_id, subscription_status, source, updated_at)
      VALUES (${email}, true, ${customer.id}, ${sub.id}, 'trialing', 'stripe', NOW())
      ON CONFLICT (email) DO UPDATE SET
        has_access = true,
        stripe_customer_id = ${customer.id},
        stripe_subscription_id = ${sub.id},
        subscription_status = 'trialing',
        source = 'stripe',
        updated_at = NOW()
    `;
    count++;
  }

  console.log(`Seeded ${count} Stripe subscriptions.`);
}

async function seedFromGrants() {
  console.log("Seeding from laborator_grants...");

  const grants = (await sql`
    SELECT email FROM laborator_grants
    WHERE expires_at IS NULL OR expires_at > NOW()
  `) as { email: string }[];

  for (const grant of grants) {
    const email = grant.email.toLowerCase();
    await sql`
      INSERT INTO laborator_access (email, has_access, source, updated_at)
      VALUES (${email}, true, 'grant', NOW())
      ON CONFLICT (email) DO UPDATE SET
        has_access = true,
        source = CASE WHEN laborator_access.source = 'stripe' THEN 'stripe' ELSE 'grant' END,
        updated_at = NOW()
    `;
  }

  console.log(`Seeded ${grants.length} grants.`);
}

async function main() {
  await migrate();
  await seedFromStripe();
  await seedFromGrants();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
