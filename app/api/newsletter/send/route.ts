import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, language = "ru", authToken } = body;

    // Simple auth check (should be replaced with proper auth)
    if (authToken !== process.env.NEWSLETTER_AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get active subscribers
    const subscribers = await query(
      `SELECT chat_id, language FROM newsletter_subscribers 
       WHERE is_active = true AND (language = $1 OR language = 'all')`,
      [language],
    );

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send messages via Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 500 });
    }

    for (const subscriber of subscribers.rows) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: subscriber.chat_id,
              text: message,
              parse_mode: "Markdown",
            }),
          },
        );

        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          const errorData = await response.json();
          results.errors.push(`Chat ${subscriber.chat_id}: ${errorData.description}`);
        }

        // Rate limiting: wait between messages
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        results.failed++;
        results.errors.push(`Error sending to ${subscriber.chat_id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: subscribers.rows.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
