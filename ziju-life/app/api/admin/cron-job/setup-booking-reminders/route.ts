import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const CRONJOB_API = "https://api.cron-job.org";
const JOB_TITLE = "Ziju Life – připomínky rezervací 24h";

/**
 * Vytvoří nebo aktualizuje cron job na cron-job.org pro volání
 * GET /api/cron/booking-reminders každou hodinu (s Authorization: Bearer CRON_SECRET).
 *
 * Env: CRONJOB_ORG_API_KEY (API klíč z cron-job.org), CRON_SECRET, NEXT_PUBLIC_SITE_URL (nebo BOOKING_REMINDER_BASE_URL).
 */
export async function POST() {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CRONJOB_ORG_API_KEY?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const baseUrl = (
    process.env.BOOKING_REMINDER_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL
  )?.replace(/\/$/, "");
  const reminderUrl = baseUrl
    ? `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/cron/booking-reminders`
    : "";

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Chybí CRONJOB_ORG_API_KEY. Nastav v .env (nebo na Vercelu) API klíč z cron-job.org → Settings.",
      },
      { status: 400 }
    );
  }
  if (!cronSecret) {
    return NextResponse.json(
      {
        error: "Chybí CRON_SECRET. Nastav v .env tajný řetězec pro zabezpečení cron endpointu.",
      },
      { status: 400 }
    );
  }
  if (!reminderUrl) {
    return NextResponse.json(
      {
        error: "Chybí URL webu. Nastav NEXT_PUBLIC_SITE_URL nebo BOOKING_REMINDER_BASE_URL (např. https://ziju.life).",
      },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const jobPayload = {
    url: reminderUrl,
    enabled: true,
    title: JOB_TITLE,
    requestMethod: 0, // GET
    schedule: {
      timezone: "Europe/Prague",
      expiresAt: 0,
      hours: [-1],
      minutes: [0],
      mdays: [-1],
      months: [-1],
      wdays: [-1],
    },
    extendedData: {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    },
  };

  try {
    const listRes = await fetch(`${CRONJOB_API}/jobs`, {
      method: "GET",
      headers,
    });
    if (!listRes.ok) {
      const t = await listRes.text();
      return NextResponse.json(
        { error: `cron-job.org list failed: ${listRes.status} ${t}` },
        { status: 502 }
      );
    }
    const listData = (await listRes.json()) as { jobs?: { jobId: number; title: string }[] };
    const existing = listData.jobs?.find((j) => j.title === JOB_TITLE);

    if (existing) {
      const patchRes = await fetch(`${CRONJOB_API}/jobs/${existing.jobId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ job: jobPayload }),
      });
      if (!patchRes.ok) {
        const t = await patchRes.text();
        return NextResponse.json(
          { error: `cron-job.org update failed: ${patchRes.status} ${t}` },
          { status: 502 }
        );
      }
      return NextResponse.json({
        ok: true,
        message: "Cron job aktualizován.",
        jobId: existing.jobId,
        url: reminderUrl,
      });
    }

    const putRes = await fetch(`${CRONJOB_API}/jobs`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ job: jobPayload }),
    });
    if (!putRes.ok) {
      const t = await putRes.text();
      return NextResponse.json(
        { error: `cron-job.org create failed: ${putRes.status} ${t}` },
        { status: 502 }
      );
    }
    const putData = (await putRes.json()) as { jobId?: number };
    return NextResponse.json({
      ok: true,
      message: "Cron job vytvořen. Bude se spouštět každou hodinu.",
      jobId: putData.jobId,
      url: reminderUrl,
    });
  } catch (err) {
    console.error("[cron-job setup] error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Nepodařilo se spojit s cron-job.org",
      },
      { status: 500 }
    );
  }
}
