import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "../../../lib/db";
import { isSlotFree } from "../../../lib/bookings";

export async function POST(request: Request) {
  console.log("[POST /api/sessions] Request received");
  const { userId } = await auth();
  if (!userId) {
    console.log("[POST /api/sessions] Unauthorized - no userId");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[POST /api/sessions] User ID:", userId);

  let body: {
    client_id?: string;
    title?: string;
    scheduled_at?: string;
    duration_minutes?: number;
    notes?: string;
    create_lead?: boolean;
    lead_name?: string;
    lead_email?: string;
    lead_phone?: string;
  };
  try {
    body = await request.json();
    console.log("[POST /api/sessions] Body:", body);
  } catch (e) {
    console.error("[POST /api/sessions] JSON parse error:", e);
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const clientId = (body.client_id ?? "").trim() || null;
  const title = (body.title ?? "").trim() || "Schůzka";
  const scheduledAt = body.scheduled_at;
  const durationMinutes = body.duration_minutes
    ? Math.min(120, Math.max(15, Number(body.duration_minutes) || 30))
    : 30;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 5000) || null : null;
  const createLead = body.create_lead === true;
  const leadName = createLead ? (body.lead_name ?? "").trim() : "";
  const leadEmail = createLead ? (body.lead_email ?? "").trim().toLowerCase() : "";
  const leadPhone = createLead ? (body.lead_phone ?? "").trim() || null : null;

  if (!scheduledAt) {
    return NextResponse.json(
      { error: "scheduled_at is required" },
      { status: 400 }
    );
  }

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Invalid scheduled_at" },
      { status: 400 }
    );
  }

  // Pokud je přiřazen klient, ověř že patří kouči
  if (clientId) {
    const clientRows = await sql`
      SELECT id FROM clients WHERE id = ${clientId} AND user_id = ${userId} LIMIT 1
    ` as { id: string }[];
    if (clientRows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
  }

  // Kontrola, jestli slot je volný
  const free = await isSlotFree(scheduledAt, durationMinutes, userId);
  if (!free) {
    return NextResponse.json(
      { error: "Slot is no longer available" },
      { status: 409 }
    );
  }

  if (createLead && (!leadName || !leadEmail)) {
    return NextResponse.json(
      { error: "lead_name and lead_email are required when create_lead is true" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  console.log("[POST /api/sessions] Creating session with ID:", id);

  try {
    let leadId: string | null = null;

    // Pokud máme vytvořit lead
    if (createLead && leadName && leadEmail) {
      const existingLead = (await sql`
        SELECT id FROM leads WHERE LOWER(email) = ${leadEmail} LIMIT 1
      `) as { id: string }[];
      if (existingLead.length > 0) {
        leadId = existingLead[0].id;
        await sql`
          UPDATE leads SET status = 'uvodni_call', updated_at = NOW() WHERE id = ${leadId}
        `;
      } else {
        leadId = crypto.randomUUID();
        await sql`
          INSERT INTO leads (id, email, name, source, status, created_at, updated_at)
          VALUES (${leadId}, ${leadEmail}, ${leadName}, 'manual', 'uvodni_call', NOW(), NOW())
        `;
      }
    }

    // Pokud není client_id, použijeme NULL (schéma to umožní po úpravě)
    // Pokud je client_id, získáme user_id z klienta, jinak použijeme userId
    let sessionUserId = userId;
    if (clientId) {
      const clientRow = (await sql`
        SELECT user_id FROM clients WHERE id = ${clientId} LIMIT 1
      `) as { user_id: string }[];
      if (clientRow.length > 0) {
        sessionUserId = clientRow[0].user_id;
      }
    }
    console.log("[POST /api/sessions] Inserting session:", {
      id,
      client_id: clientId || null,
      user_id: sessionUserId,
      title,
      scheduled_at: date.toISOString(),
      duration_minutes: durationMinutes,
      notes,
    });
    await sql`
      INSERT INTO sessions (id, client_id, user_id, title, scheduled_at, duration_minutes, notes, created_at, updated_at)
      VALUES (${id}, ${clientId || null}, ${sessionUserId}, ${title}, ${date.toISOString()}, ${durationMinutes}, ${notes}, NOW(), NOW())
    `;
    console.log("[POST /api/sessions] Session created successfully");

    return NextResponse.json({
      ok: true,
      session_id: id,
      lead_id: leadId,
    });
  } catch (err) {
    console.error("POST /api/sessions", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
