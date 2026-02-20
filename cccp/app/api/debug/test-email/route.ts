import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmation } from "../../../../lib/email";

/**
 * Debug endpoint to test email sending.
 * Call: GET /api/debug/test-email?to=test@example.com
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("to") || "test@example.com";

  const hasApiKey = !!process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  // Test email sending
  const result = await sendBookingConfirmation({
    to: testEmail,
    name: "Test User",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 30,
    eventName: "Test Konzultace",
    note: "Toto je testovací email",
  });

  return NextResponse.json({
    success: result.success,
    error: result.error,
    debug: {
      hasApiKey,
      fromEmail,
      testEmail,
      resendInitialized: !!process.env.RESEND_API_KEY,
    },
  });
}
