/**
 * ClickUp: jeden úkol na lead (Status: REACH OUT) nebo na konzultaci (Status: MEETING / Jméno - datum).
 * Při rezervaci se existující úkol aktualizuje na MEETING s termínem.
 */

import type { ClickUpFieldConfig } from "./booking-settings";

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

/** Custom field IDs z fieldConfig nebo env. statusOptionValue = option id dropdownu v ClickUp. */
function getCustomFields(
  params: {
    name: string;
    email: string;
    source?: string;
    statusOptionValue?: number;
  },
  fieldConfig: ClickUpFieldConfig | null
): { id: string; value: string | number }[] {
  const fields: { id: string; value: string | number }[] = [];
  const mailId = (fieldConfig?.fieldMail?.trim() || process.env.CLICKUP_FIELD_MAIL?.trim()) || null;
  const zdrojId = (fieldConfig?.fieldZdroj?.trim() || process.env.CLICKUP_FIELD_ZDROJ?.trim()) || null;
  const jmenoId = (fieldConfig?.fieldJmeno?.trim() || process.env.CLICKUP_FIELD_JMENO?.trim()) || null;
  const statusId = (fieldConfig?.fieldStatus?.trim() || process.env.CLICKUP_FIELD_STATUS?.trim()) || null;

  if (mailId) fields.push({ id: mailId, value: params.email });
  if (zdrojId && params.source) fields.push({ id: zdrojId, value: params.source });
  if (jmenoId) fields.push({ id: jmenoId, value: params.name });
  if (statusId && params.statusOptionValue != null && params.statusOptionValue !== 0) {
    fields.push({ id: statusId, value: params.statusOptionValue });
  }
  return fields;
}

/** Vytvořit úkol Status REACH OUT (lead vyplnil jméno + mail, nerezervoval). Název: Jméno - Reach out */
export interface CreateLeadTaskParams {
  listId: string;
  name: string;
  email: string;
  note?: string | null;
  source?: string;
  fieldConfig?: ClickUpFieldConfig | null;
}

export async function createLeadTask(params: CreateLeadTaskParams): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  if (!token()) {
    console.warn("[clickup] CLICKUP_API_TOKEN not set, skipping lead task");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { listId, name, email, note, source, fieldConfig = null } = params;
  if (!listId?.trim()) {
    console.warn("[clickup] CLICKUP_LIST_ID not set, skipping lead task");
    return { ok: false, error: "CLICKUP_LIST_ID not set" };
  }

  const title = `${name} – Reach out`;
  const description = buildDescription({ name, email, source, note });
  const statusNameReachOut = (fieldConfig?.statusNameReachOut?.trim() || process.env.CLICKUP_STATUS_NAME_REACH_OUT?.trim()) || null;
  const statusOpt = statusNameReachOut ? undefined : (fieldConfig?.statusReachOut?.trim() || process.env.CLICKUP_STATUS_NEDOKONCENE?.trim()) || null;
  const customFields = getCustomFields(
    { name, email, source, statusOptionValue: statusOpt ? Number(statusOpt) : undefined },
    fieldConfig
  );

  try {
    const body: Record<string, unknown> = {
      name: title,
      description,
    };
    if (statusNameReachOut) body.status = statusNameReachOut;
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

/** Aktualizovat existující úkol na Status MEETING s termínem. Název: Jméno - datum */
export async function updateTaskToBooking(params: {
  taskId: string;
  name: string;
  email: string;
  source?: string;
  note?: string | null;
  slotStartAt: Date;
  durationMinutes: number;
  fieldConfig?: ClickUpFieldConfig | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!token()) {
    console.warn("[clickup] CLICKUP_API_TOKEN not set");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { taskId, name, email, source, note, slotStartAt, durationMinutes, fieldConfig = null } = params;
  const title = `${name} – ${formatSlotShort(slotStartAt)}`;
  const description = buildDescription({ name, email, source, note, slotStartAt, durationMinutes });
  const startDate = slotStartAt.getTime();
  const dueDate = startDate + durationMinutes * 60 * 1000;

  const statusName = (fieldConfig?.statusNameMeeting?.trim() || process.env.CLICKUP_STATUS_NAME_MEETING?.trim()) || null;

  const body: Record<string, unknown> = {
    name: title,
    description,
    start_date: startDate,
    due_date: dueDate,
    start_date_time: true,
    due_date_time: true,
  };
  if (statusName) body.status = statusName;

  try {
    const res = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: "PUT",
      headers: {
        Authorization: token()!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[clickup] Update task to booking failed:", res.status, text);
      return { ok: false, error: text };
    }

    // Pokud není výchozí Status (status name), zkus nastavit custom field status
    if (!statusName) {
      const statusId = (fieldConfig?.fieldStatus?.trim() || process.env.CLICKUP_FIELD_STATUS?.trim()) || null;
      const konzultaceOpt = (fieldConfig?.statusMeeting?.trim() || process.env.CLICKUP_STATUS_KONZULTACE?.trim()) || null;
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
    }
    console.log("[clickup] Úkol aktualizován na MEETING, taskId:", taskId);
    return { ok: true };
  } catch (err) {
    console.warn("[clickup] updateTaskToBooking error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Vytvořit nový úkol Status MEETING (když lead neměl úkol – např. rezervace bez předchozího leadu). Název: Jméno - datum */
export interface CreateBookingTaskParams {
  listId: string;
  name: string;
  email: string;
  note?: string | null;
  source?: string;
  slotStartAt: Date;
  durationMinutes: number;
  fieldConfig?: ClickUpFieldConfig | null;
}

export async function createBookingTask(params: CreateBookingTaskParams): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  if (!token()) {
    console.warn("[clickup] CLICKUP_API_TOKEN není nastaven – úkol v ClickUp se nevytvoří.");
    return { ok: false, error: "CLICKUP_API_TOKEN not set" };
  }
  const { listId, name, email, note, source, slotStartAt, durationMinutes, fieldConfig = null } = params;
  if (!listId?.trim()) {
    console.warn("[clickup] CLICKUP_LIST_ID není nastaven.");
    return { ok: false, error: "CLICKUP_LIST_ID not set" };
  }

  const title = `${name} – ${formatSlotShort(slotStartAt)}`;
  const description = buildDescription({ name, email, source, note, slotStartAt, durationMinutes });
  const startDate = slotStartAt.getTime();
  const dueDate = startDate + durationMinutes * 60 * 1000;
  const statusNameMeeting = (fieldConfig?.statusNameMeeting?.trim() || process.env.CLICKUP_STATUS_NAME_MEETING?.trim()) || null;
  const statusOpt = statusNameMeeting ? undefined : (fieldConfig?.statusMeeting?.trim() || process.env.CLICKUP_STATUS_KONZULTACE?.trim()) || null;
  const customFields = getCustomFields(
    { name, email, source, statusOptionValue: statusOpt ? Number(statusOpt) : undefined },
    fieldConfig
  );

  try {
    const body: Record<string, unknown> = {
      name: title,
      description,
      start_date: startDate,
      due_date: dueDate,
      start_date_time: true,
      due_date_time: true,
      time_estimate: durationMinutes * 60 * 1000,
    };
    if (statusNameMeeting) body.status = statusNameMeeting;
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
    console.log("[clickup] Úkol (MEETING) vytvořen, taskId:", data.id);
    return { ok: true, taskId: data.id };
  } catch (err) {
    console.warn("[clickup] createBookingTask error:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
