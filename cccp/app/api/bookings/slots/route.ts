import { NextResponse } from "next/server";
import { getAvailableSlots } from "../../../../lib/bookings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Query params 'from' and 'to' (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  const fromDate = from.slice(0, 10);
  const toDate = to.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return NextResponse.json(
      { error: "Invalid date format, use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(fromDate, toDate);
    return NextResponse.json(slots);
  } catch (err) {
    console.error("GET /api/bookings/slots", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
