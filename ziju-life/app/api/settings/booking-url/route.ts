import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

const DEFAULT_BOOKING_URL =
  "https://talentino.app/book/matej/30-minutova-konzultace-zdarma?embed=1";

/** Veřejné API – vrací URL iframe pro rezervaci (z admin_settings nebo env / default). Bez auth. */
export async function GET() {
  try {
    const result = (await sql`
      SELECT booking_embed_url FROM admin_settings LIMIT 1
    `) as { booking_embed_url: string | null }[];
    const url =
      result[0]?.booking_embed_url?.trim() ||
      process.env.NEXT_PUBLIC_BOOKING_EMBED_URL?.trim() ||
      DEFAULT_BOOKING_URL;
    return NextResponse.json({ bookingEmbedUrl: url });
  } catch {
    const url =
      process.env.NEXT_PUBLIC_BOOKING_EMBED_URL?.trim() || DEFAULT_BOOKING_URL;
    return NextResponse.json({ bookingEmbedUrl: url });
  }
}
