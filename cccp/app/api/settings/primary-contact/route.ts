import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

const PRIMARY_CONTACT_TYPES = ["email", "phone", "other"] as const;
export type PrimaryContactType = (typeof PRIMARY_CONTACT_TYPES)[number];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT primary_contact_type, primary_contact_value
    FROM user_settings WHERE user_id = ${userId} LIMIT 1
  ` as { primary_contact_type: string | null; primary_contact_value: string | null }[];

  const row = rows[0];
  const type = row?.primary_contact_type && PRIMARY_CONTACT_TYPES.includes(row.primary_contact_type as PrimaryContactType)
    ? (row.primary_contact_type as PrimaryContactType)
    : null;
  const value = row?.primary_contact_value?.trim() || null;

  return NextResponse.json({
    primary_contact_type: type,
    primary_contact_value: value,
  });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { primary_contact_type?: string | null; primary_contact_value?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawType = body.primary_contact_type;
  const rawValue = body.primary_contact_value;

  const type: PrimaryContactType | null =
    rawType == null || rawType === ""
      ? null
      : PRIMARY_CONTACT_TYPES.includes(rawType as PrimaryContactType)
        ? (rawType as PrimaryContactType)
        : null;
  const value =
    rawValue == null || typeof rawValue !== "string"
      ? null
      : rawValue.trim().slice(0, 200) || null;

  await sql`
    INSERT INTO user_settings (user_id, first_day_of_week, use_integrated_calendars, primary_contact_type, primary_contact_value, updated_at)
    VALUES (${userId}, 1, true, ${type}, ${value}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      primary_contact_type = EXCLUDED.primary_contact_type,
      primary_contact_value = EXCLUDED.primary_contact_value,
      updated_at = NOW()
  `;

  return NextResponse.json({ primary_contact_type: type, primary_contact_value: value });
}
