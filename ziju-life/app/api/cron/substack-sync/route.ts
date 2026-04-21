import { NextRequest, NextResponse } from "next/server";
import { syncSubstack } from "@/lib/pipeline/substack-sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncSubstack();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[substack-sync] Failed:", error);
    return NextResponse.json(
      { error: "Substack sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
