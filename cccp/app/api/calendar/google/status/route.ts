import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCalendarConnection } from "lib/google-calendar";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getCalendarConnection(userId);
  return NextResponse.json({
    connected: !!conn?.refresh_token,
  });
}
