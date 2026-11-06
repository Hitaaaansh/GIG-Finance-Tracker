import { NextResponse } from "next/server";
import { generateDailySummaryEmail, sendNotificationEmail } from "@/lib/notifications/email";
import { calculateDashboard } from "@/domain/target/engine";
import { todayLocalDate } from "@/lib/utils/time";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toEmail, profile, summary, type } = body;

    if (!toEmail || !profile || !summary) {
      return NextResponse.json(
        { error: "Missing required fields: toEmail, profile, summary" },
        { status: 400 }
      );
    }

    const today = todayLocalDate();
    const emailPayload = generateDailySummaryEmail(profile, summary, type || "morning", today);
    const result = await sendNotificationEmail(toEmail, emailPayload);

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      simulated: !process.env.RESEND_API_KEY,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process email request" },
      { status: 500 }
    );
  }
}
