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
    console.warn("[clickup] CLICKUP_API_TOKEN not set");
    return { ok: false, error: "ClickUp not configured" };
  }

  const { listId, name, email, note, source, slotStartAt, durationMinutes } = params;
  const title = `Konzultace – ${name} (${formatSlot(slotStartAt)})`;
  const description = [
    `E-mail: ${email}`,
    note ? `Poznámka: ${note}` : null,
    source ? `Zdroj: ${source}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // ClickUp due date: milliseconds
  const dueDate = slotStartAt.getTime();

  try {
    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        description,
        due_date: dueDate,
        time_estimate: durationMinutes * 60 * 1000, // milliseconds
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("[clickup] Create task failed:", res.status, text);
      return { ok: false, error: text };
    }
    const data = (await res.json()) as { id?: string };
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
