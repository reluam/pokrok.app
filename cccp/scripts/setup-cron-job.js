/**
 * Creates or updates the "Booking Reminders" cron job on cron-job.org via their REST API.
 * Run once after deploy: node scripts/setup-cron-job.js
 *
 * Requires in .env.local (or environment):
 *   CRON_JOB_ORG_API_KEY  - API key from https://cron-job.org (Settings → API)
 *   NEXT_PUBLIC_APP_URL   - Base URL of the app (e.g. https://talentino.app)
 *   CRON_SECRET_TOKEN     - Token used to secure /api/cron/send-booking-reminders
 *
 * API docs: https://docs.cron-job.org/rest-api.html
 */

const CRON_JOB_API = "https://api.cron-job.org";
const JOB_TITLE = "Booking Reminders";

function loadEnv() {
  try {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = value;
        }
      });
    }
  } catch (e) {
    // ignore
  }
}

async function main() {
  loadEnv();

  const apiKey = process.env.CRON_JOB_ORG_API_KEY;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");
  const secretToken = process.env.CRON_SECRET_TOKEN;

  if (!apiKey) {
    console.error("Missing CRON_JOB_ORG_API_KEY. Get it from https://cron-job.org → Settings → API.");
    process.exit(1);
  }
  if (!appUrl) {
    console.error("Missing NEXT_PUBLIC_APP_URL or APP_URL (e.g. https://talentino.app).");
    process.exit(1);
  }
  if (!secretToken) {
    console.error("Missing CRON_SECRET_TOKEN (used to secure the reminders endpoint).");
    process.exit(1);
  }

  const jobUrl = `${appUrl}/api/cron/send-booking-reminders?token=${encodeURIComponent(secretToken)}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // List existing jobs
  const listRes = await fetch(`${CRON_JOB_API}/jobs`, { headers });
  if (!listRes.ok) {
    const text = await listRes.text();
    console.error("Failed to list cron jobs:", listRes.status, text);
    if (listRes.status === 401) console.error("Check CRON_JOB_ORG_API_KEY.");
    process.exit(1);
  }

  const listData = await listRes.json();
  const existing = (listData.jobs || []).find(
    (j) => j.title === JOB_TITLE || (j.url && j.url.includes("/api/cron/send-booking-reminders"))
  );

  const jobPayload = {
    job: {
      url: jobUrl,
      title: JOB_TITLE,
      enabled: true,
      saveResponses: true,
      requestMethod: 0, // GET
      schedule: {
        timezone: "Europe/Prague",
        expiresAt: 0,
        hours: [-1],   // every hour
        mdays: [-1],
        minutes: [0],  // at :00
        months: [-1],
        wdays: [-1],
      },
    },
  };

  if (existing) {
    // Update existing job
    const patchRes = await fetch(`${CRON_JOB_API}/jobs/${existing.jobId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(jobPayload),
    });
    if (!patchRes.ok) {
      console.error("Failed to update cron job:", patchRes.status, await patchRes.text());
      process.exit(1);
    }
    console.log("Cron job updated successfully. Job ID:", existing.jobId);
    console.log("URL:", jobUrl.replace(secretToken, "***"));
  } else {
    // Create new job
    const createRes = await fetch(`${CRON_JOB_API}/jobs`, {
      method: "PUT",
      headers,
      body: JSON.stringify(jobPayload),
    });
    if (!createRes.ok) {
      console.error("Failed to create cron job:", createRes.status, await createRes.text());
      process.exit(1);
    }
    const createData = await createRes.json();
    console.log("Cron job created successfully. Job ID:", createData.jobId);
    console.log("URL:", jobUrl.replace(secretToken, "***"));
  }

  console.log("Schedule: every hour at :00 (Europe/Prague)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
