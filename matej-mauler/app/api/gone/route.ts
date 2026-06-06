import { NextResponse } from "next/server";
import { getDeletedHrefs } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";

// Seznam hrefů smazaných experimentů — čte ho middleware (cachovaně) pro 410 Gone.
export async function GET() {
  try {
    return NextResponse.json({ hrefs: await getDeletedHrefs() });
  } catch {
    return NextResponse.json({ hrefs: [] });
  }
}
