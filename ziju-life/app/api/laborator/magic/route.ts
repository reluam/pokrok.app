import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import Stripe from "stripe";
import { Resend } from "resend";

// ── Token helpers ─────────────────────────────────────────────────────────────

function getSecret(): string {
  const s = process.env.MAGIC_LINK_SECRET;
  if (!s) throw new Error("MAGIC_LINK_SECRET is not set");
  return s;
}

function createToken(email: string): string {
  const exp = Date.now() + 15 * 60 * 1000; // 15 minutes
  const payload = `${email}|${exp}`;
  const mac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${mac}`).toString("base64url");
}

function verifyToken(token: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;
    const [email, expStr, mac] = parts;

    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return null;

    const expected = createHmac("sha256", getSecret())
      .update(`${email}|${expStr}`)
      .digest("hex");

    if (
      mac.length !== expected.length ||
      !timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"))
    ) {
      return null;
    }

    return { email };
  } catch {
    return null;
  }
}

// ── Stripe: verify active subscription for email ──────────────────────────────

async function hasActiveSubscription(email: string): Promise<boolean> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return false;

  const stripe = new Stripe(key);
  const customers = await stripe.customers.list({ email, limit: 5 });

  for (const customer of customers.data) {
    for (const status of ["active", "trialing"] as const) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status,
        limit: 1,
      });
      if (subs.data.length > 0) return true;
    }
  }
  return false;
}

// ── Cookie constants ──────────────────────────────────────────────────────────

const COOKIE_NAME = "lab_email";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ziju.life";
}

// ── POST /api/laborator/magic — send magic link ───────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Neplatný e-mail." }, { status: 400 });
    }

    const active = await hasActiveSubscription(email);
    if (!active) {
      return NextResponse.json(
        {
          error:
            "Pro tento e-mail nemáme aktivní předplatné. Zkontroluj adresu nebo si pořiď přístup.",
        },
        { status: 404 }
      );
    }

    const token = createToken(email);
    const magicUrl = `${getSiteUrl()}/api/laborator/magic?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Žiju life <noreply@ziju.life>",
      to: email,
      subject: "Přihlášení do Laboratoře — žiju life",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#171717">
          <p style="font-size:14px;color:#888;margin:0 0 24px">žiju life · Laboratoř</p>
          <h1 style="font-size:24px;font-weight:800;margin:0 0 12px">Přihlásit se do Laboratoře</h1>
          <p style="font-size:15px;color:#444;margin:0 0 28px;line-height:1.6">
            Klikni na tlačítko níže — odkaz platí <strong>15 minut</strong>.
          </p>
          <a href="${magicUrl}"
            style="display:inline-block;background:#FF8C42;color:#fff;text-decoration:none;
                   font-weight:700;font-size:15px;padding:14px 28px;border-radius:100px">
            Přihlásit se →
          </a>
          <p style="font-size:12px;color:#aaa;margin:28px 0 0;line-height:1.6">
            Pokud jsi o přihlášení nepožádal/a, ignoruj tento e-mail.<br>
            Odkaz funguje jen jednou a vyprší za 15 minut.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[magic POST]", err);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat e-mail. Zkus to znovu." },
      { status: 500 }
    );
  }
}

// ── GET /api/laborator/magic?token=xxx — verify & set cookie ─────────────────

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrl();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  const result = verifyToken(token);

  if (!result) {
    return NextResponse.redirect(
      `${siteUrl}/laborator?magic=expired`
    );
  }

  const response = NextResponse.redirect(`${siteUrl}/laborator/dashboard`);
  response.cookies.set(COOKIE_NAME, result.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
