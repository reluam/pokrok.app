import { NextResponse } from "next/server";
import { getDeletedHrefs } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

// Pro middleware: hrefy smazaných experimentů → 410 Gone.
export async function GET() {
  return NextResponse.json({ hrefs: await getDeletedHrefs() });
}
