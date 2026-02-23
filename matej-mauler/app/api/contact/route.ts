import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "E-mail je povinný." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Chyba konfigurace serveru." },
        { status: 500 }
      );
    }

    // Kam doručit poptávku (tvůj inbox)
    const recipientEmail =
      process.env.CONTACT_EMAIL?.trim() || "matej@ziju.life";
    // Odkud se posílá (ověřená doména v Resend)
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() || "automat@mail.ziju.life";
    const emailHtml = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2 style="color: #0a0a0c;">Nová zpráva z webu</h2>
        <p><strong>Jméno:</strong> ${name ? escapeHtml(name) : "—"}</p>
        <p><strong>E-mail:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p><strong>Telefon:</strong> ${phone ? escapeHtml(phone) : "—"}</p>
        ${message ? `<p><strong>Zpráva:</strong></p><p style="white-space: pre-wrap;">${escapeHtml(message)}</p>` : ""}
        <p style="margin-top: 24px; color: #666; font-size: 12px;">Odesláno: ${new Date().toLocaleString("cs-CZ")}</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      replyTo: email.trim(),
      subject: `Kontakt z webu${name?.trim() ? ` od ${name.trim()}` : ""}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se odeslat zprávu. Zkuste to později nebo napište přímo na e-mail." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Chyba při odesílání zprávy." },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}
