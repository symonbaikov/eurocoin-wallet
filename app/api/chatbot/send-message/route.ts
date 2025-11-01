import { NextRequest, NextResponse } from "next/server";
import {
  createChatbotMessage,
  getChatbotSessionByWallet,
  createChatbotSession,
} from "@/lib/database/queries";
import { Markup } from "telegraf";
import { getTelegramApi } from "@/lib/telegram/bot";

interface SendMessageRequest {
  sessionId?: string;
  walletAddress: string;
  message: string;
  locale?: string;
}

// Helper function to check if message requires human attention
// Send ALL messages to Telegram for admin review
function requiresHumanAttention(text: string): boolean {
  // For now, send all messages to admin for testing
  return true;

  // Original logic (commented out for testing):
  // const lowerText = text.toLowerCase();
  // const fraudKeywords = [
  //   "мошен",
  //   "fraud",
  //   "обман",
  //   "scam",
  //   "кража",
  //   "theft",
  //   "подозр",
  //   "suspicious",
  // ];
  // return fraudKeywords.some((keyword) => lowerText.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();

    if (!body.walletAddress || !body.message) {
      return NextResponse.json(
        { error: "walletAddress and message are required" },
        { status: 400 },
      );
    }

    // Get or create session
    let session = await getChatbotSessionByWallet(body.walletAddress);
    if (!session) {
      session = await createChatbotSession({
        userWalletAddress: body.walletAddress,
        locale: body.locale || "ru",
      });
    }

    // Save user message to database
    await createChatbotMessage({
      sessionId: session.id,
      type: "user",
      text: body.message,
    });

    // Check if needs human attention
    const needsHuman = requiresHumanAttention(body.message);

    console.log("[send-message] Message analysis:", {
      message: body.message,
      needsHuman,
      managerChatId: process.env.TELEGRAM_MANAGER_CHAT_ID,
    });

    // If needs human, send to Telegram
    if (needsHuman) {
      try {
        const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
        console.log("[send-message] Sending to Telegram, managerChatId:", managerChatId);

        if (managerChatId) {
          const telegramMessage =
            `💬 *Новое сообщение от пользователя*\n\n` +
            `👤 Кошелёк: \`${body.walletAddress}\`\n` +
            `📝 Сообщение: ${body.message}\n` +
            `🆔 Сессия: \`${session.id}\``;

          console.log("[send-message] Telegram message:", telegramMessage);

          // Create inline keyboard with reply button
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback("💬 Ответить пользователю", `reply_to_chat_${session.id}`)],
          ]);

          await getTelegramApi().sendMessage(parseInt(managerChatId), telegramMessage, {
            parse_mode: "Markdown",
            ...keyboard,
          });

          console.log("[send-message] Successfully sent to Telegram");
        } else {
          console.log("[send-message] TELEGRAM_MANAGER_CHAT_ID not configured");
        }
      } catch (telegramError) {
        console.error("[send-message] Error sending to Telegram:", telegramError);
        // Don't fail the request if Telegram fails
      }
    } else {
      console.log(
        "[send-message] Message doesn't require human attention, not sending to Telegram",
      );
    }

    // Generate bot response
    const responseText =
      body.locale === "en"
        ? "Thank you for your message. I have forwarded it to the operator. Please wait for a response."
        : "Спасибо за ваше сообщение. Я передал его оператору. Ожидайте ответа.";

    // Save bot response to database
    await createChatbotMessage({
      sessionId: session.id,
      type: "bot",
      text: responseText,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      botResponse: {
        text: responseText,
        requiresHuman: needsHuman,
      },
    });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
