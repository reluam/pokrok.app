import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

type MeetingType = {
  id: string;
  label: string;
  description?: string;
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
  defaultDurationMinutes?: number;
  priceId?: string;
  priceCzk?: number;
  stripePaymentLinkUrl?: string;
};

const DEFAULT_MEETING_TYPES: MeetingType[] = [
  {
    id: "intro_free",
    label: "Úvodní 30min sezení zdarma",
    description: "První nezávazná konzultace, kde zjistíme, jestli si sedíme.",
    isPaid: false,
  },
  {
    id: "coaching_paid",
    label: "Koučovací sezení (placené)",
    description: "Hlubší práce na tvých cílech a návycích.",
    isPaid: true,
  },
];

export async function GET() {
  try {
    let meetingTypes: MeetingType[] = DEFAULT_MEETING_TYPES;
    try {
      const rows = (await sql`
        SELECT booking_meeting_types
        FROM admin_settings
        LIMIT 1
      `) as { booking_meeting_types: string | null }[];
      const raw = rows[0]?.booking_meeting_types;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned: MeetingType[] = [];
          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const id = String((item as any).id ?? "").trim();
            const label = String((item as any).label ?? "").trim();
            if (!id || !label) continue;
            const startDateRaw = (item as any).startDate;
            const endDateRaw = (item as any).endDate;
            const mt: MeetingType = {
              id,
              label,
              description:
                typeof (item as any).description === "string"
                  ? (item as any).description
                  : undefined,
              isPaid: Boolean((item as any).isPaid),
            };
            if (typeof startDateRaw === "string" && startDateRaw.length >= 10) {
              mt.startDate = startDateRaw.slice(0, 10);
            }
            if (typeof endDateRaw === "string" && endDateRaw.length >= 10) {
              mt.endDate = endDateRaw.slice(0, 10);
            }
            const defDur = Number((item as any).defaultDurationMinutes);
            if (!Number.isNaN(defDur) && defDur > 0) {
              mt.defaultDurationMinutes = defDur;
            }
            const priceIdRaw = (item as any).priceId;
            if (typeof priceIdRaw === "string" && priceIdRaw.trim()) {
              mt.priceId = priceIdRaw.trim();
            }
            const priceCzkRaw = (item as any).priceCzk;
            const priceNum = Number(priceCzkRaw);
            if (!Number.isNaN(priceNum) && priceNum > 0) {
              mt.priceCzk = Math.round(priceNum);
            }
            const stripePaymentLinkUrlRaw = (item as any).stripePaymentLinkUrl;
            if (typeof stripePaymentLinkUrlRaw === "string" && stripePaymentLinkUrlRaw.trim()) {
              mt.stripePaymentLinkUrl = stripePaymentLinkUrlRaw.trim();
            }
            cleaned.push(mt);
          }
          if (cleaned.length > 0) meetingTypes = cleaned;
        }
      }
    } catch {
      // ignore, fall back to default types
    }

    return NextResponse.json({ meetingTypes });
  } catch (err) {
    console.error("GET /api/settings/meeting-types error:", err);
    return NextResponse.json(
      { meetingTypes: DEFAULT_MEETING_TYPES },
      { status: 200 }
    );
  }
}

