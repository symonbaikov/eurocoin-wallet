import { NextResponse } from "next/server";

/**
 * GET /api/telegram/get-chat-id
 * Fetches recent updates to find admin chat ID
 */
export async function GET() {
  try {
    const apiKey = process.env.TELEGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "TELEGRAM_API_KEY not set" }, { status: 500 });
    }

    // Fetch updates directly from Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${apiKey}/getUpdates`);

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    const data = await response.json();
    const updates = data.result || [];

    if (updates.length === 0) {
      return NextResponse.json({
        message: "No updates found. Send a message to the bot first!",
        instructions:
          "Open Telegram and send any message to your bot, then try this endpoint again.",
      });
    }

    // Extract chat IDs from updates
    const chatIds = (updates as unknown[])
      .map((update: unknown) => {
        const u = update as Record<string, unknown>;
        if ("message" in u && u.message) {
          const msg = u.message as Record<string, unknown>;
          return {
            chat_id: (msg.chat as Record<string, unknown>)?.id,
            username: (msg.from as Record<string, unknown>)?.username,
            first_name: (msg.from as Record<string, unknown>)?.first_name,
            message: msg.text,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      chatIds,
      instructions: "Add one of these chat_id values to your .env.local as TELEGRAM_ADMIN_CHAT_ID",
    });
  } catch (error) {
    console.error("Error getting chat ID:", error);
    return NextResponse.json(
      {
        error: "Failed to get chat ID",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
