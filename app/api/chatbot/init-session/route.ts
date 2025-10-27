import { NextRequest, NextResponse } from "next/server";
import {
  createChatbotSession,
  getChatbotSessionByWallet,
  getChatbotMessagesBySession,
} from "@/lib/database/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, locale } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // Try to get existing session
    let session = await getChatbotSessionByWallet(walletAddress);

    if (!session) {
      // Create new session
      session = await createChatbotSession({
        userWalletAddress: walletAddress,
        locale: locale || "ru",
      });
    }

    // Load existing messages
    const dbMessages = await getChatbotMessagesBySession(session.id);
    const formattedMessages = dbMessages.map((msg) => ({
      id: msg.id,
      type: msg.type,
      text: msg.text,
      timestamp: msg.created_at.toISOString(),
      translated: msg.translated_text || undefined,
      isTranslated: msg.is_translated,
    }));

    return NextResponse.json({
      sessionId: session.id,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Error initializing session:", error);
    return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
  }
}
