import { NextResponse, type NextRequest } from "next/server";
import { getRound } from "@/lib/radioServer";
import { renderRound } from "@/lib/radioRender";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Audio kola — server vyrenderuje zmasterovaný WAV. Deterministické → immutable cache na CDN. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ round: string }> }) {
  const { round } = await ctx.params;
  const roundNo = Number(round);
  if (!Number.isInteger(roundNo) || roundNo < 0) return NextResponse.json({ error: "bad round" }, { status: 400 });
  try {
    const row = await getRound(roundNo);
    if (!row) return NextResponse.json({ error: "unknown round" }, { status: 404 });
    const { wav } = renderRound(row.state, roundNo);
    return new NextResponse(new Uint8Array(wav), {
      headers: {
        "content-type": "audio/wav",
        "cache-control": "public, max-age=300, s-maxage=31536000, immutable",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "render" }, { status: 500 });
  }
}
