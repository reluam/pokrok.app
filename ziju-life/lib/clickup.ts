/**
 * ClickUp: jeden úkol na lead (Nedokončené / Reach out) nebo na konzultaci (Konzultace / Jméno - datum).
 * Při rezervaci se existující úkol aktualizuje na Konzultace s termínem.
 */

const token = () => process.env.CLICKUP_API_TOKEN?.trim();

function formatSlotShort(d: Date): string {
  return d.toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" });
}

/** Popis úkolu – všechna info jako záloha v textu */
function buildDescription(params: {
  name: string;
  email: string;
  source?: string;
  note?: string | null;
  slotStartAt?: Date;
  durationMinutes?: number;
}): string {
  const { name, email, source, note, slotStartAt, durationMinutes } = params;
  const lines = [
    `Jméno: ${name}`,
    `E-mail: ${email}`,
    source ? `Zdroj: ${source}` : null,
    note ? `Poznámka: ${note}` : null,
    slotStartAt ? `Termín: ${formatSlotShort(slotStartAt)}` : null,
    durationMinutes != null ? `Délka: ${durationMinutes} min` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

/** Custom field IDs z env (volitelné). statusOptionValue = option id dropdownu v ClickUp. */
function getCustomFields(params: {
  name: string;
  email: string;
  source?: string;
  statusOptionValue?: number; // option id pro dropdown (Nedokončené nebo Konzultace)
}): { id: string; value: string | number }[] {
  const fields: { id: string; value: string | number }[] = [];
  const mailId = process.env.CLICKUP_FIELD_MAIL?.trim();
  const zdrojId = process.env.CLICKUP_FIELD_ZDROJ?.trim();
  const jmenoId = process.env.CLICKUP_FIELD_JMENO?.trim();
  const statusId = process.env.CLICKUP_FIELD_STATUS?.trim();

  if (mailId) fields.push({ id: mailId, value: params.email });
  if (zdrojId && params.source) fields.push({ id: zdrojId, value: params.source });
  if (jmenoId) fields.push({ id: jmenoId, value: params.name });
  if (statusId && params.statusOptionValue != null && params.statusOptionValue !== 0) {
    fields.push({ id: statusId, value: params.statusOptionValue });
  }
  return fields;
}

/** Vytvořit úkol „Nedokončené“ (lead vyplnil jméno + mail, nerezervoval). Název: Jméno - Reach out */
export interface CreateLeadTaskParams {
  listId: string;
  name: string;
  email: string;
  note?: string | null;
  source?: string;
}

export async function createLeadTask(params: CreateLeadTaskParams): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  if (!token()) {
    console.warn("[clickup] CLICKUP_API_TOKEN not set, skipping lead task");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { listId, name, email, note, source } = params;
  if (!listId?.trim()) {
    console.warn("[clickup] CLICKUP_LIST_ID not set, skipping lead task");
    return { ok: false, error: "CLICKUP_LIST_ID not set" };
  }

  const title = `${name} – Reach out`;
  const description = buildDescription({ name, email, source, note });
  const statusOpt = process.env.CLICKUP_STATUS_NEDOKONCENE?.trim();
  const customFields = getCustomFields({
    name,
    email,
    source,
    statusOptionValue: statusOpt ? Number(statusOpt) : undefined,
  });

  try {
    const body: Record<string, unknown> = {
      name: title,
      description,
    };
    if (customFields.length > 0) body.custom_fields = customFields;

    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId.trim()}/task`, {
      method: "POST",
      headers: {
        Authorization: token()!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    console.log("[clickup] Úkol (Reach out) vytvořen, taskId:", data.id);
    return { ok: true, taskId: data.id };
  } catch (err) {
    console.warn("[clickup] createLeadTask error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Aktualizovat existující úkol na „Konzultace“ s termínem. Název: Jméno - datum */
export async function updateTaskToBooking(params: {
  taskId: string;
  name: string;
  email: string;
  source?: string;
  note?: string | null;
  slotStartAt: Date;
  durationMinutes: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!token()) {
    console.warn("[clickup] CLICKUP_API_TOKEN not set");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { taskId, name, email, source, note, slotStartAt, durationMinutes } = params;
  const title = `${name} – ${formatSlotShort(slotStartAt)}`;
  const description = buildDescription({ name, email, source, note, slotStartAt, durationMinutes });
  const dueDate = slotStartAt.getTime();

  try {
    const res = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: "PUT",
      headers: {
        Authorization: token()!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        description,
        due_date: dueDate,
        due_date_time: true,
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[clickup] Update task to booking failed:", res.status, text);
      return { ok: false, error: text };
    }

    // Nastavit dropdown na Konzultace (custom field)
    const statusId = process.env.CLICKUP_FIELD_STATUS?.trim();
    const konzultaceOpt = process.env.CLICKUP_STATUS_KONZULTACE?.trim();
    if (statusId && konzultaceOpt) {
      const fieldRes = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/field/${statusId}`, {
        method: "POST",
        headers: {
          Authorization: token()!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: Number(konzultaceOpt) }),
      });
      if (!fieldRes.ok) {
        console.warn("[clickup] Set status field failed:", await fieldRes.text());
      }
    }
    console.log("[clickup] Úkol aktualizován na Konzultace, taskId:", taskId);
    return { ok: true };
  } catch (err) {
    console.warn("[clickup] updateTaskToBooking error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Vytvořit nový úkol „Konzultace“ (když lead neměl úkol – např. rezervace bez předchozího leadu). Název: Jméno - datum */
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
  if (!token()) {
    console.warn("[clickup] CLICKUP_API_TOKEN není nastaven – úkol v ClickUp se nevytvoří.");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { listId, name, email, note, source, slotStartAt, durationMinutes } = params;
  if (!listId?.trim()) {
    console.warn("[clickup] CLICKUP_LIST_ID není nastaven.");
    return { ok: false, error: "CLICKUP_LIST_ID not set" };
  }

  const title = `${name} – ${formatSlotShort(slotStartAt)}`;
  const description = buildDescription({ name, email, source, note, slotStartAt, durationMinutes });
  const dueDate = slotStartAt.getTime();
  const statusOpt = process.env.CLICKUP_STATUS_KONZULTACE?.trim();
  const customFields = getCustomFields({
    name,
    email,
    source,
    statusOptionValue: statusOpt ? Number(statusOpt) : undefined,
  });

  try {
    const body: Record<string, unknown> = {
      name: title,
      description,
      due_date: dueDate,
      due_date_time: true,
      time_estimate: durationMinutes * 60 * 1000,
    };
    if (customFields.length > 0) body.custom_fields = customFields;

    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId.trim()}/task`, {
      method: "POST",
      headers: {
        Authorization: token()!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    console.log("[clickup] Úkol (Konzultace) vytvořen, taskId:", data.id);
    return { ok: true, taskId: data.id };
  } catch (err) {
    console.warn("[clickup] createBookingTask error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
