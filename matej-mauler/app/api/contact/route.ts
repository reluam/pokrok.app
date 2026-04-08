import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // TODO: integrate with email service (Resend, SendGrid, etc.)
  console.log("Contact form submission:", { name, email, message });

  return NextResponse.json({ ok: true });
}
