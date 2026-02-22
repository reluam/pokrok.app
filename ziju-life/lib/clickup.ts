/**
 * Create a ClickUp task for a booking (lead with due date = slot time).
 * Uses CLICKUP_API_TOKEN and CLICKUP_LIST_ID from env (or passed listId).
 */
export interface CreateBookingTaskParams {
  listId: string;
  name: string;
  email: string;
  note?: string | null;
  source?: string;
  slotStartAt: Date;
  durationMinutes: number;
}

export async function createBookingTask(params: CreateBookingTaskParams): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  const token = process.env.CLICKUP_API_TOKEN?.trim();
  if (!token) {
    console.warn("[clickup] CLICKUP_API_TOKEN není nastaven – úkol v ClickUp se nevytvoří. Nastav v .env nebo na Vercelu.");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }

  const { listId, name, email, note, source, slotStartAt, durationMinutes } = params;
  if (!listId?.trim()) {
    console.warn("[clickup] CLICKUP_LIST_ID není nastaven – úkol se nevytvoří. Nastav v Admin → Nastavení (ClickUp List ID) nebo v .env.");
    return { ok: false, error: "CLICKUP_LIST_ID not set" };
  }

  const title = `Konzultace – ${name} (${formatSlot(slotStartAt)})`;
  const description = [
    `E-mail: ${email}`,
    note ? `Poznámka: ${note}` : null,
    source ? `Zdroj: ${source}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // ClickUp: due_date v milisekundách, due_date_time: true = zobrazit čas v kalendáři
  const dueDate = slotStartAt.getTime();

  try {
    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId.trim()}/task`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        description,
        due_date: dueDate,
        due_date_time: true,
        time_estimate: durationMinutes * 60 * 1000, // milliseconds
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn("[clickup] Create task failed:", res.status, text);
      return { ok: false, error: text };
    }
    let data: { id?: string };
    try {
      data = JSON.parse(text) as { id?: string };
    } catch {
      return { ok: false, error: "Invalid JSON response" };
    }
    console.log("[clickup] Úkol vytvořen, taskId:", data.id);
    return { ok: true, taskId: data.id };
  } catch (err) {
    console.warn("[clickup] createBookingTask error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function formatSlot(d: Date): string {
  return d.toLocaleString("cs-CZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Vytvořit úkol v ClickUp bez due date (lead, který zatím nerezervoval). */
export interface CreateLeadTaskParams {
  listId: string;
  name: string;
  email: string;
  note?: string | null;
  source?: string;
}

export async function createLeadTask(params: CreateLeadTaskParams): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  const token = process.env.CLICKUP_API_TOKEN?.trim();
  if (!token) {
    console.warn("[clickup] CLICKUP_API_TOKEN not set, skipping lead task");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { listId, name, email, note, source } = params;
  if (!listId?.trim()) {
    console.warn("[clickup] CLICKUP_LIST_ID not set, skipping lead task");
    return { ok: false, error: "CLICKUP_LIST_ID not set" };
  }

  const title = `Lead – ${name} (bez termínu)`;
  const description = [
    `E-mail: ${email}`,
    note ? `Poznámka: ${note}` : null,
    source ? `Zdroj: ${source}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId.trim()}/task`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        description,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn("[clickup] Create lead task failed:", res.status, text);
      return { ok: false, error: text };
    }
    let data: { id?: string };
    try {
      data = JSON.parse(text) as { id?: string };
    } catch {
      return { ok: false, error: "Invalid JSON response" };
    }
    return { ok: true, taskId: data.id };
  } catch (err) {
    console.warn("[clickup] createLeadTask error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
